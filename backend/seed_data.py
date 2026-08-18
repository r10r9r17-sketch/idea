"""Catálogo e dados de apoio da BRAZA TECH.

IMPORTANTE: os produtos abaixo são DEMONSTRATIVOS (DEMO MODE). Preços marcados como
`price_is_demo: True` devem ser revisados no painel administrativo antes de ir ao ar.
Nenhuma avaliação, depoimento, pedido, venda ou histórico de preço fictício é criado.
"""

import uuid
from datetime import datetime, timezone

NO_INFO = "Informação não informada pelo fornecedor."

CATEGORIES = [
    {"slug": "audio", "name": "Áudio", "icon": "Headphones", "order": 1},
    {"slug": "games", "name": "Games", "icon": "Gamepad2", "order": 2},
    {"slug": "smart", "name": "Smart", "icon": "Watch", "order": 3},
    {"slug": "impressao", "name": "Impressão", "icon": "Printer", "order": 4},
    {"slug": "cabos", "name": "Cabos", "icon": "Cable", "order": 5},
    {"slug": "carregadores", "name": "Carregadores", "icon": "BatteryCharging", "order": 6},
    {"slug": "acessorios", "name": "Acessórios", "icon": "Package", "order": 7},
    {"slug": "suportes", "name": "Suportes", "icon": "MonitorSmartphone", "order": 8},
    {"slug": "drones", "name": "Drones", "icon": "Plane", "order": 9},
    {"slug": "pc", "name": "PC", "icon": "Cpu", "order": 10},
    {"slug": "notebooks", "name": "Notebooks", "icon": "Laptop", "order": 11},
    {"slug": "perifericos", "name": "Periféricos", "icon": "Keyboard", "order": 12},
    {"slug": "controle-rc", "name": "Controle RC", "icon": "Radio", "order": 13},
]

IMG = {
    "drone1": "https://images.unsplash.com/photo-1487219116710-23ffcb172b2b?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "drone2": "https://images.pexels.com/photos/4263072/pexels-photo-4263072.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "drone3": "https://images.unsplash.com/photo-1514043454212-14c181f46583?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "hero": "https://images.pexels.com/photos/14541106/pexels-photo-14541106.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "keyboard": "https://images.unsplash.com/photo-1599792215800-042be231c6cd?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "keyboard2": "https://images.pexels.com/photos/9020272/pexels-photo-9020272.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "headset": "https://images.unsplash.com/photo-1566055972289-c52022ae23b7?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "setup": "https://images.unsplash.com/photo-1636036824578-d0d300a4effb?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "watch": "https://images.unsplash.com/photo-1758348844319-6ca57f0a8ea0?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "gadgets": "https://images.pexels.com/photos/12877873/pexels-photo-12877873.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "gadgets2": "https://images.pexels.com/photos/7989740/pexels-photo-7989740.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "notebook": "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "notebook2": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "components": "https://images.unsplash.com/photo-1651340741844-48edcd3fe79c?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "laptop_rgb": "https://images.unsplash.com/photo-1771014846919-3a1cf73aeea1?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
}

DEMO_PRODUCTS = [
    {"name": "Drone Compacto com Câmera FPV", "category": "drones", "brand": NO_INFO, "price": 1899.0, "previous_price": 2299.0,
     "image": IMG["drone1"], "gallery": [IMG["drone1"], IMG["drone3"], IMG["hero"]], "stock": 6, "product_type": "own_store",
     "short_description": "Drone dobrável para captação aérea, com transmissão de imagem em tempo real.",
     "keywords": ["drone", "fpv", "camera aerea"]},
    {"name": "Drone de Corrida FPV Racing", "category": "drones", "brand": NO_INFO, "price": 2790.0, "previous_price": None,
     "image": IMG["drone2"], "gallery": [IMG["drone2"], IMG["drone1"]], "stock": 0, "product_type": "affiliate",
     "affiliate_url": "https://www.mercadolivre.com.br/", "affiliate_network": "Mercado Livre",
     "short_description": "Drone de corrida para pilotos que buscam velocidade e resposta imediata.",
     "keywords": ["drone", "racing", "fpv"]},
    {"name": "Headset Gamer com Microfone Removível", "category": "audio", "brand": NO_INFO, "price": 349.9, "previous_price": 449.9,
     "image": IMG["headset"], "gallery": [IMG["headset"], IMG["setup"]], "stock": 14, "product_type": "own_store",
     "short_description": "Headset over-ear para jogos e chamadas, com microfone removível.",
     "keywords": ["headset", "fone", "gamer", "audio"]},
    {"name": "Teclado Mecânico RGB Compacto", "category": "perifericos", "brand": NO_INFO, "price": 289.9, "previous_price": 379.9,
     "image": IMG["keyboard"], "gallery": [IMG["keyboard"], IMG["keyboard2"]], "stock": 3, "product_type": "own_store",
     "short_description": "Teclado mecânico com iluminação RGB e layout compacto para setups menores.",
     "keywords": ["teclado", "mecanico", "rgb", "periferico"]},
    {"name": "Switches Mecânicos Hot-Swap (Kit)", "category": "perifericos", "brand": NO_INFO, "price": 129.9, "previous_price": None,
     "image": IMG["keyboard2"], "gallery": [IMG["keyboard2"]], "stock": 22, "product_type": "own_store",
     "short_description": "Kit de switches para teclados hot-swap, permitindo personalizar o toque.",
     "keywords": ["switch", "teclado", "hot swap"]},
    {"name": "Smartwatch com Monitor de Atividades", "category": "smart", "brand": NO_INFO, "price": 599.0, "previous_price": 749.0,
     "image": IMG["watch"], "gallery": [IMG["watch"], IMG["gadgets"]], "stock": 9, "product_type": "own_store",
     "short_description": "Smartwatch com acompanhamento de atividades físicas e notificações do celular.",
     "keywords": ["smartwatch", "relogio", "smart"]},
    {"name": "Fone Bluetooth True Wireless", "category": "audio", "brand": NO_INFO, "price": 259.9, "previous_price": 319.9,
     "image": IMG["gadgets"], "gallery": [IMG["gadgets"], IMG["gadgets2"]], "stock": 18, "product_type": "own_store",
     "short_description": "Fone sem fio com estojo de recarga para uso diário.",
     "keywords": ["fone", "bluetooth", "tws", "audio"]},
    {"name": "Notebook Ultrafino para Trabalho", "category": "notebooks", "brand": NO_INFO, "price": 4299.0, "previous_price": 4899.0,
     "image": IMG["notebook"], "gallery": [IMG["notebook"], IMG["notebook2"]], "stock": 4, "product_type": "own_store",
     "short_description": "Notebook leve para produtividade, estudo e trabalho remoto.",
     "keywords": ["notebook", "laptop", "ultrafino"]},
    {"name": "Notebook Gamer com Teclado RGB", "category": "notebooks", "brand": NO_INFO, "price": 6899.0, "previous_price": None,
     "image": IMG["laptop_rgb"], "gallery": [IMG["laptop_rgb"], IMG["setup"]], "stock": 2, "product_type": "affiliate",
     "affiliate_url": "https://www.amazon.com.br/", "affiliate_network": "Amazon Associates",
     "short_description": "Notebook voltado a jogos, com teclado retroiluminado RGB.",
     "keywords": ["notebook", "gamer", "rgb"]},
    {"name": "Placa-Mãe para Montagem de PC", "category": "pc", "brand": NO_INFO, "price": 989.0, "previous_price": 1189.0,
     "image": IMG["components"], "gallery": [IMG["components"]], "stock": 7, "product_type": "own_store",
     "short_description": "Placa-mãe para montagem de desktop, com slots de expansão e M.2.",
     "keywords": ["placa mae", "pc", "componentes", "hardware"]},
    {"name": "Mouse Gamer Sensor Óptico", "category": "games", "brand": NO_INFO, "price": 179.9, "previous_price": 229.9,
     "image": IMG["setup"], "gallery": [IMG["setup"], IMG["keyboard"]], "stock": 25, "product_type": "own_store",
     "short_description": "Mouse gamer com sensor óptico e iluminação personalizável.",
     "keywords": ["mouse", "gamer", "games"]},
    {"name": "Cabo USB-C Trançado 2 m", "category": "cabos", "brand": NO_INFO, "price": 59.9, "previous_price": 79.9,
     "image": IMG["gadgets2"], "gallery": [IMG["gadgets2"]], "stock": 40, "product_type": "own_store",
     "short_description": "Cabo USB-C reforçado com malha trançada para carregamento e dados.",
     "keywords": ["cabo", "usb-c", "carregamento"]},
    {"name": "Carregador Rápido GaN 65W", "category": "carregadores", "brand": NO_INFO, "price": 219.9, "previous_price": 279.9,
     "image": IMG["gadgets2"], "gallery": [IMG["gadgets2"], IMG["gadgets"]], "stock": 12, "product_type": "own_store",
     "short_description": "Carregador compacto GaN de 65W com múltiplas saídas.",
     "keywords": ["carregador", "gan", "65w", "fonte"]},
    {"name": "Suporte Articulado para Monitor", "category": "suportes", "brand": NO_INFO, "price": 329.0, "previous_price": None,
     "image": IMG["notebook2"], "gallery": [IMG["notebook2"]], "stock": 8, "product_type": "own_store",
     "short_description": "Suporte articulado com ajuste de altura e inclinação para monitores.",
     "keywords": ["suporte", "monitor", "ergonomia"]},
    {"name": "Impressora Multifuncional Compacta", "category": "impressao", "brand": NO_INFO, "price": 1149.0, "previous_price": 1349.0,
     "image": IMG["notebook2"], "gallery": [IMG["notebook2"]], "stock": 5, "product_type": "own_store",
     "short_description": "Impressora multifuncional para escritório e uso doméstico.",
     "keywords": ["impressora", "multifuncional", "impressao"]},
    {"name": "Rádio Controle 2.4 GHz para Modelismo", "category": "controle-rc", "brand": NO_INFO, "price": 749.0, "previous_price": None,
     "image": IMG["drone3"], "gallery": [IMG["drone3"]], "stock": 0, "product_type": "affiliate",
     "affiliate_url": "https://www.mercadolivre.com.br/", "affiliate_network": "Mercado Livre",
     "short_description": "Rádio controle para aeromodelos, drones e automodelos.",
     "keywords": ["radio controle", "rc", "modelismo"]},
    {"name": "Hub USB-C 6 em 1", "category": "acessorios", "brand": NO_INFO, "price": 289.9, "previous_price": 349.9,
     "image": IMG["gadgets"], "gallery": [IMG["gadgets"]], "stock": 16, "product_type": "own_store",
     "short_description": "Hub USB-C com portas HDMI, USB-A e leitor de cartões.",
     "keywords": ["hub", "usb-c", "adaptador", "acessorio"]},
    {"name": "Caixa de Som Bluetooth Portátil", "category": "audio", "brand": NO_INFO, "price": 399.9, "previous_price": 469.9,
     "image": IMG["gadgets2"], "gallery": [IMG["gadgets2"]], "stock": 11, "product_type": "own_store",
     "short_description": "Caixa de som portátil com conexão Bluetooth e bateria interna.",
     "keywords": ["caixa de som", "bluetooth", "audio", "portatil"]},
]


def normalize_product(data):
    price = float(data.get("price") or 0)
    previous = data.get("previous_price")
    previous = float(previous) if previous else None
    discount = round(((previous - price) / previous) * 100) if previous and previous > price else 0
    gallery = data.get("gallery") or ([data.get("image")] if data.get("image") else [])
    return {
        "id": data.get("id") or str(uuid.uuid4()),
        "name": data.get("name", "").strip(),
        "slug": data.get("slug", ""),
        "category": data.get("category", "acessorios"),
        "subcategory": data.get("subcategory") or "",
        "short_description": data.get("short_description") or NO_INFO,
        "description": data.get("description") or data.get("short_description") or NO_INFO,
        "price": price,
        "previous_price": previous,
        "promo_price": float(data["promo_price"]) if data.get("promo_price") else None,
        "price_min": float(data["price_min"]) if data.get("price_min") else None,
        "price_max": float(data["price_max"]) if data.get("price_max") else None,
        "price_is_demo": bool(data.get("price_is_demo", False)),
        "discount_percent": discount,
        "image": data.get("image") or "",
        "gallery": gallery,
        "sku": data.get("sku") or "",
        "stock": max(int(data.get("stock") or 0), 0),
        "min_stock": max(int(data.get("min_stock") or 3), 0),
        "brand": data.get("brand") or NO_INFO,
        "model": data.get("model") or NO_INFO,
        "specs": data.get("specs") or [],
        "includes": data.get("includes") or [],
        "warranty": data.get("warranty") or NO_INFO,
        "rating": data.get("rating"),
        "reviews_count": int(data.get("reviews_count") or 0),
        "status": data.get("status") or "active",
        "is_featured": bool(data.get("is_featured", False)),
        "is_offer": bool(discount > 0 or data.get("is_offer", False)),
        "is_recommended": bool(data.get("is_recommended", False)),
        "product_type": data.get("product_type") or "own_store",
        "affiliate_url": data.get("affiliate_url") or "",
        "affiliate_network": data.get("affiliate_network") or "",
        "external_product_id": data.get("external_product_id") or "",
        "supplier": data.get("supplier") or "",
        "keywords": data.get("keywords") or [],
        "created_at": data.get("created_at") or datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


DEFAULT_SETTINGS = {
    "id": "site",
    "store_name": "BRAZA TECH",
    "slogan": "Tecnologia que conecta. Confiança que entrega.",
    "whatsapp": "67998737690",
    "whatsapp_display": "(67) 99873-7690",
    "email": "therenanlima@gmail.com",
    "instagram": "",
    "facebook": "",
    "youtube": "",
    "shipping_flat": 29.9,
    "free_shipping_min": 299.0,
    "seo_title": "BRAZA TECH — Tecnologia que conecta. Confiança que entrega.",
    "seo_description": "Loja brasileira de tecnologia com curadoria de produtos, informações claras e atendimento próximo.",
    "affiliate_disclaimer": "Alguns links podem gerar comissão para a Braza Tech, sem custo adicional para você.",
    "policies": "Consulte o SAC da Braza Tech para obter informações atualizadas.",
}


async def seed(db, demo_mode: bool):
    for cat in CATEGORIES:
        await db.categories.update_one({"slug": cat["slug"]}, {"$setOnInsert": {**cat, "id": str(uuid.uuid4())}}, upsert=True)

    existing_settings = await db.settings.find_one({"id": "site"})
    if not existing_settings:
        await db.settings.insert_one(dict(DEFAULT_SETTINGS))

    if not demo_mode:
        return

    if await db.products.count_documents({}) == 0:
        for index, raw in enumerate(DEMO_PRODUCTS):
            product = normalize_product(
                {
                    **raw,
                    "slug": raw["name"].lower().replace(" ", "-").replace("ç", "c").replace("ã", "a").replace("á", "a")
                    .replace("â", "a").replace("é", "e").replace("ê", "e").replace("í", "i").replace("ó", "o")
                    .replace("õ", "o").replace("ú", "u").replace(".", "").replace(",", "").replace("(", "").replace(")", ""),
                    "sku": f"BT-{1000 + index}",
                    "price_is_demo": True,
                    "is_featured": index < 6,
                    "description": raw["short_description"] + " " + NO_INFO,
                    "specs": [{"label": "Especificações técnicas", "value": NO_INFO}],
                    "includes": [NO_INFO],
                    "warranty": NO_INFO,
                }
            )
            await db.products.insert_one(product)

    if await db.banners.count_documents({}) == 0:
        await db.banners.insert_one(
            {
                "id": str(uuid.uuid4()),
                "title": "Tecnologia para quem escolhe melhor",
                "subtitle": "Produtos selecionados, informações claras e atendimento próximo.",
                "image": IMG["hero"],
                "link": "/produtos",
                "active": True,
                "order": 1,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )
