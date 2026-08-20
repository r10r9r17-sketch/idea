"""E-mails transacionais da BRAZA TECH via integração gerenciada (Resend).

Todos os destinatários vêm de registros do banco e todo o HTML vem de templates
server-side. Nenhuma rota aceita destinatário, assunto ou HTML do cliente.
"""

import ipaddress
import logging
import os
import re
from html import escape
from html.parser import HTMLParser
from typing import Any, Dict, Optional
from urllib.parse import urlparse

import httpx

logger = logging.getLogger("brazatech.email")

EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY", "")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "BRAZA TECH")
EMAIL_REPLY_TO = os.environ.get("EMAIL_REPLY_TO")
APP_URL = (os.environ.get("PUBLIC_APP_URL") or "").rstrip("/")

_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan()
    scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for phrase in _CRED_ASK:
        if phrase in body:
            raise ValueError(f"Email asks the recipient for credentials: {phrase!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        parsed = urlparse(low)
        if not _host_ok(parsed.hostname or "") or parsed.username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for match in _HOSTISH.finditer(text):
            if not _same_site(match.group(1).lower(), real):
                raise ValueError(f"Anchor text {match.group(1)!r} ≠ real link host {real!r} (G3)")


async def send_email(*, to: str, subject: str, html: str) -> Optional[str]:
    _assert_safe_email(subject, html)
    if not EMAIL_KEY:
        logger.warning("EMERGENT_EMAIL_KEY ausente — e-mail não enviado (%s)", subject)
        return None
    payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    if EMAIL_REPLY_TO:
        payload["contact_email"] = EMAIL_REPLY_TO
    try:
        async with httpx.AsyncClient(timeout=30) as http:
            response = await http.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": EMAIL_KEY},
                json=payload,
            )
        response.raise_for_status()
        return response.json().get("id")
    except Exception as exc:  # noqa: BLE001
        logger.error("Falha ao enviar e-mail (%s): %s", subject, exc)
        return None


def _brl(value: float) -> str:
    return f"R$ {float(value or 0):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def _layout(title: str, intro: str, order: Dict[str, Any], extra: str = "") -> str:
    rows = "".join(
        f'<tr><td style="padding:6px 0;color:#333">{escape(str(item["quantity"]))}x '
        f'{escape(item["name"])}</td><td align="right" style="padding:6px 0;color:#333">'
        f'{_brl(item["line_total"])}</td></tr>'
        for item in order.get("items", [])
    )
    link = f'{APP_URL}/pedido/{escape(order["number"])}'
    return (
        '<table role="presentation" width="100%" style="background:#f4f6f8;padding:24px">'
        '<tr><td align="center"><table role="presentation" width="600" '
        'style="background:#ffffff;border-radius:12px;font-family:Arial,Helvetica,sans-serif">'
        '<tr><td style="background:#0077ff;padding:20px 24px;border-radius:12px 12px 0 0">'
        '<span style="color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:1px">BRAZA TECH</span>'
        '<div style="color:#dceaff;font-size:12px;margin-top:4px">Tecnologia que conecta. Confiança que entrega.</div>'
        '</td></tr>'
        f'<tr><td style="padding:24px"><h1 style="margin:0 0 12px;font-size:20px;color:#0d1117">{escape(title)}</h1>'
        f'<p style="margin:0 0 16px;color:#444;font-size:14px;line-height:1.5">{intro}</p>'
        f'{extra}'
        f'<p style="margin:16px 0 8px;color:#0d1117;font-size:14px"><strong>Pedido {escape(order["number"])}</strong></p>'
        f'<table role="presentation" width="100%" style="font-size:14px">{rows}'
        f'<tr><td style="padding:8px 0;border-top:1px solid #e3e7ec;color:#666">Frete</td>'
        f'<td align="right" style="padding:8px 0;border-top:1px solid #e3e7ec;color:#666">{_brl(order.get("shipping"))}</td></tr>'
        f'<tr><td style="padding:4px 0;color:#666">Desconto</td>'
        f'<td align="right" style="padding:4px 0;color:#666">- {_brl(order.get("discount"))}</td></tr>'
        f'<tr><td style="padding:8px 0;font-weight:bold;color:#0d1117">Total</td>'
        f'<td align="right" style="padding:8px 0;font-weight:bold;color:#0d1117">{_brl(order.get("total"))}</td></tr>'
        '</table>'
        f'<p style="margin:24px 0 0"><a href="{link}" '
        'style="background:#0077ff;color:#ffffff;text-decoration:none;padding:12px 22px;'
        'border-radius:8px;font-size:14px;display:inline-block">Acompanhar meu pedido</a></p>'
        '<p style="margin:24px 0 0;font-size:12px;color:#8b95a1">Enviado por BRAZA TECH. '
        'Nunca solicitamos senha, código ou dados de cartão por e-mail.</p>'
        '</td></tr></table></td></tr></table>'
    )


TEMPLATES = {
    "order_received": (
        "Recebemos seu pedido {number} — BRAZA TECH",
        "Pedido recebido",
        "Olá, {name}! Recebemos seu pedido e ele está aguardando a confirmação do pagamento.",
    ),
    "payment_approved": (
        "Pagamento aprovado do pedido {number} — BRAZA TECH",
        "Pagamento aprovado",
        "Boa notícia, {name}! O pagamento do seu pedido foi confirmado e já estamos preparando tudo.",
    ),
    "payment_pending": (
        "Pagamento pendente do pedido {number} — BRAZA TECH",
        "Pagamento pendente",
        "Olá, {name}! Ainda estamos aguardando a confirmação do pagamento do seu pedido.",
    ),
    "order_shipped": (
        "Seu pedido {number} foi enviado — BRAZA TECH",
        "Pedido enviado",
        "Olá, {name}! Seu pedido saiu para entrega. Acompanhe os detalhes pela sua conta.",
    ),
    "order_delivered": (
        "Seu pedido {number} foi entregue — BRAZA TECH",
        "Pedido entregue",
        "Olá, {name}! Registramos a entrega do seu pedido. Qualquer dúvida, fale com nosso SAC.",
    ),
    "order_cancelled": (
        "Pedido {number} cancelado — BRAZA TECH",
        "Pedido cancelado",
        "Olá, {name}! Seu pedido foi cancelado. Se não foi você, fale com o nosso atendimento.",
    ),
}

STATUS_EVENTS = {
    "paid": "payment_approved",
    "pending_payment": "payment_pending",
    "shipped": "order_shipped",
    "delivered": "order_delivered",
    "cancelled": "order_cancelled",
}


async def send_order_email(event: str, order: Dict[str, Any]) -> Optional[str]:
    template = TEMPLATES.get(event)
    recipient = (order.get("customer") or {}).get("email")
    if not template or not recipient:
        return None
    subject_tpl, title, intro_tpl = template
    name = escape((order.get("customer") or {}).get("name", "cliente").split(" ")[0])
    html = _layout(title, intro_tpl.format(name=name), order)
    return await send_email(to=recipient, subject=subject_tpl.format(number=order["number"]), html=html)
