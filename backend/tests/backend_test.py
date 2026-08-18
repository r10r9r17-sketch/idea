"""
BRAZA TECH backend API test suite
Covers: catalog, auth, cart pricing, orders, mercado pago, admin CRUD,
reviews moderation, support and admin protection.
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://brazatech-staging.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@brazatech.com.br"
ADMIN_PASSWORD = "BrazaAdmin@2026"
CUSTOMER_EMAIL = "cliente@brazatech.com.br"
CUSTOMER_PASSWORD = "Cliente@2026"


# --------------------- fixtures ---------------------
@pytest.fixture(scope="session")
def http():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(http):
    r = http.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def customer_token(http):
    r = http.post(f"{API}/auth/login", json={"email": CUSTOMER_EMAIL, "password": CUSTOMER_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def products(http):
    r = http.get(f"{API}/products?limit=60")
    assert r.status_code == 200
    return r.json()["items"]


@pytest.fixture(scope="session")
def own_store_product(products):
    for p in products:
        if p.get("product_type") == "own_store" and p.get("stock", 0) > 0:
            return p
    pytest.skip("No own_store product with stock")


@pytest.fixture(scope="session")
def affiliate_product(products):
    for p in products:
        if p.get("product_type") == "affiliate":
            return p
    pytest.skip("No affiliate product")


# --------------------- catalog ---------------------
class TestCatalog:
    def test_root_alive(self, http):
        r = http.get(f"{API}/")
        assert r.status_code == 200
        assert "BRAZA TECH" in r.json()["app"]

    def test_categories_13(self, http):
        r = http.get(f"{API}/categories")
        assert r.status_code == 200
        data = r.json()
        assert len(data["categories"]) == 13
        for c in data["categories"]:
            assert "product_count" in c

    def test_products_filters_and_discount(self, http):
        r = http.get(f"{API}/products?on_offer=true&sort=discount&limit=5")
        assert r.status_code == 200
        for p in r.json()["items"]:
            if p.get("previous_price") and p.get("price"):
                expected = round((p["previous_price"] - p["price"]) / p["previous_price"] * 100)
                assert p["discount_percent"] == expected

    def test_products_search_q(self, http):
        r = http.get(f"{API}/products?q=drone")
        assert r.status_code == 200
        items = r.json()["items"]
        assert len(items) >= 1
        assert any("drone" in i["name"].lower() or "drone" in " ".join(i.get("keywords", [])).lower() for i in items)

    def test_products_pagination(self, http):
        r = http.get(f"{API}/products?limit=5&page=1")
        assert r.status_code == 200
        j = r.json()
        assert j["limit"] == 5 and j["page"] == 1
        assert len(j["items"]) <= 5

    def test_product_detail_related_and_empty_price_history(self, http, own_store_product):
        r = http.get(f"{API}/products/{own_store_product['slug']}")
        assert r.status_code == 200
        p = r.json()
        assert p["price_history"] == []
        assert isinstance(p["reviews"], list)
        assert isinstance(p["related"], list)

    def test_search_suggestions(self, http):
        r = http.get(f"{API}/search/suggestions?q=fo")
        assert r.status_code == 200
        j = r.json()
        assert "products" in j and "categories" in j

    def test_search_suggestions_short(self, http):
        r = http.get(f"{API}/search/suggestions?q=a")
        assert r.status_code == 200
        assert r.json() == {"products": [], "categories": []}


# --------------------- auth ---------------------
class TestAuth:
    def test_login_wrong_password(self, http):
        r = http.post(f"{API}/auth/login", json={"email": f"nobody-{uuid.uuid4().hex[:6]}@example.com", "password": "wrong"})
        assert r.status_code == 401

    def test_login_success_customer(self, http):
        r = http.post(f"{API}/auth/login", json={"email": CUSTOMER_EMAIL, "password": CUSTOMER_PASSWORD})
        assert r.status_code == 200
        j = r.json()
        assert j["user"]["role"] == "customer"
        assert j["access_token"]

    def test_me_with_bearer(self, http, customer_token):
        r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {customer_token}"})
        assert r.status_code == 200
        assert r.json()["email"] == CUSTOMER_EMAIL

    def test_register_and_duplicate(self, http):
        email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        r = http.post(f"{API}/auth/register", json={"name": "Test", "email": email, "password": "Senha@2026"})
        assert r.status_code == 200
        r2 = http.post(f"{API}/auth/register", json={"name": "Test", "email": email, "password": "Senha@2026"})
        assert r2.status_code == 400

    def test_forgot_password_generic(self, http):
        r = http.post(f"{API}/auth/forgot-password", json={"email": "unknown-user-xxx@example.com"})
        assert r.status_code == 200
        assert "instru" in r.json()["message"].lower()

    def test_bruteforce_lockout(self, http):
        # Use unique email so we don't lock the shared customer account
        email = f"lockout_{uuid.uuid4().hex[:8]}@example.com"
        # Ensure user does not exist -> wrong password causes 401 each time, count increases
        codes = []
        for _ in range(6):
            r = requests.post(f"{API}/auth/login", json={"email": email, "password": "wrong"})
            codes.append(r.status_code)
        # After 5 failures we expect a 429
        assert 429 in codes, f"expected lockout, got {codes}"


# --------------------- admin protection ---------------------
class TestAdminProtection:
    def test_no_token_returns_401(self, http):
        r = requests.get(f"{API}/admin/products")
        assert r.status_code == 401

    def test_customer_forbidden(self, customer_token):
        r = requests.get(f"{API}/admin/products", headers={"Authorization": f"Bearer {customer_token}"})
        assert r.status_code == 403

    def test_admin_ok(self, admin_token):
        r = requests.get(f"{API}/admin/products", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200


# --------------------- cart/quote ---------------------
class TestCartQuote:
    def test_recalculates_server_side(self, http, own_store_product):
        # Client sends bogus price -> ignored
        payload = {"items": [{"product_id": own_store_product["id"], "quantity": 1, "unit_price": 0.01}]}
        r = http.post(f"{API}/cart/quote", json=payload)
        assert r.status_code == 200
        j = r.json()
        assert j["items"][0]["unit_price"] == own_store_product["price"]
        assert j["subtotal"] == round(own_store_product["price"], 2)

    def test_affiliate_rejected_in_cart(self, http, affiliate_product):
        payload = {"items": [{"product_id": affiliate_product["id"], "quantity": 1}]}
        r = http.post(f"{API}/cart/quote", json=payload)
        assert r.status_code == 400
        assert "parceiro" in r.json()["detail"].lower() or "fornecedor" in r.json()["detail"].lower()

    def test_quantity_over_stock(self, http, products):
        # Pick own_store product with stock between 1 and 49
        target = next((p for p in products if p["product_type"] == "own_store" and 0 < p.get("stock", 0) < 50), None)
        if not target:
            pytest.skip("No product with low stock available")
        payload = {"items": [{"product_id": target["id"], "quantity": 50}]}
        r = http.post(f"{API}/cart/quote", json=payload)
        assert r.status_code == 400, r.text

    def test_free_shipping_above_299(self, http, products):
        # Pick a product with price around >= 300 and stock available
        big = next((p for p in products if p["product_type"] == "own_store" and p["price"] >= 300 and p["stock"] > 0), None)
        if not big:
            pytest.skip("No large-priced own-store product")
        r = http.post(f"{API}/cart/quote", json={"items": [{"product_id": big["id"], "quantity": 1}]})
        assert r.status_code == 200
        assert r.json()["shipping"] == 0.0

    def test_shipping_charged_below_299(self, http, products):
        small = next((p for p in products if p["product_type"] == "own_store" and p["price"] < 299 and p["stock"] > 0), None)
        if not small:
            pytest.skip("No small product")
        r = http.post(f"{API}/cart/quote", json={"items": [{"product_id": small["id"], "quantity": 1}]})
        assert r.status_code == 200
        assert r.json()["shipping"] > 0


# --------------------- coupon (admin creates -> quote applies) ---------------------
class TestCoupon:
    def test_create_apply_and_cleanup(self, http, admin_token, own_store_product):
        code = f"TEST{uuid.uuid4().hex[:6].upper()}"
        headers = {"Authorization": f"Bearer {admin_token}"}
        # create 10% coupon
        r = requests.post(f"{API}/admin/coupons", json={"code": code, "type": "percent", "value": 10, "active": True}, headers=headers)
        assert r.status_code == 200, r.text
        coupon_id = r.json()["id"]
        try:
            q = http.post(f"{API}/cart/quote", json={
                "items": [{"product_id": own_store_product["id"], "quantity": 1}],
                "coupon_code": code,
            })
            assert q.status_code == 200
            j = q.json()
            assert j["coupon"] == code
            expected_discount = round(own_store_product["price"] * 0.10, 2)
            assert abs(j["discount"] - expected_discount) < 0.02
        finally:
            requests.delete(f"{API}/admin/coupons/{coupon_id}", headers=headers)


# --------------------- orders ---------------------
class TestOrders:
    def test_create_order_and_fetch(self, http, own_store_product):
        payload = {
            "items": [{"product_id": own_store_product["id"], "quantity": 1}],
            "payment_method": "pix",
            "customer": {
                "name": "Cliente Teste",
                "email": "cliente@brazatech.com.br",
                "phone": "11999998888",
                "cpf": "12345678901",
                "cep": "01311000",
                "state": "SP",
                "city": "São Paulo",
                "street": "Av Paulista",
                "number": "1000",
                "complement": "",
                "district": "Bela Vista",
            },
        }
        r = http.post(f"{API}/orders", json=payload)
        assert r.status_code == 200, r.text
        order = r.json()
        assert order["number"].startswith("BT")
        assert order["status"] == "pending_payment"
        # totals recalculated server-side
        assert order["subtotal"] == round(own_store_product["price"], 2)

        g = http.get(f"{API}/orders/{order['number']}")
        assert g.status_code == 200
        assert g.json()["number"] == order["number"]

    def test_admin_mark_paid_decrements_stock(self, http, admin_token, own_store_product):
        headers = {"Authorization": f"Bearer {admin_token}"}
        # snapshot stock
        detail = http.get(f"{API}/products/{own_store_product['slug']}").json()
        before = detail["stock"]
        if before <= 0:
            pytest.skip("no stock for this test")

        payload = {
            "items": [{"product_id": own_store_product["id"], "quantity": 1}],
            "payment_method": "pix",
            "customer": {
                "name": "X", "email": "cliente@brazatech.com.br", "phone": "1", "cpf": "1",
                "cep": "01311000", "state": "SP", "city": "SP", "street": "R", "number": "1",
                "complement": "", "district": "D",
            },
        }
        order = http.post(f"{API}/orders", json=payload).json()
        r = requests.put(f"{API}/admin/orders/{order['id']}", json={"status": "paid"}, headers=headers)
        assert r.status_code == 200
        after = http.get(f"{API}/products/{own_store_product['slug']}").json()["stock"]
        assert after == max(before - 1, 0)


# --------------------- payments ---------------------
class TestPayments:
    def test_mp_config_reports_not_configured(self, http):
        r = http.get(f"{API}/payments/config")
        assert r.status_code == 200
        assert r.json()["configured"] is False

    def test_mp_preference_503_when_missing_token(self, http, own_store_product):
        # First create an order
        payload = {
            "items": [{"product_id": own_store_product["id"], "quantity": 1}],
            "payment_method": "pix",
            "customer": {
                "name": "X", "email": "cliente@brazatech.com.br", "phone": "1", "cpf": "1",
                "cep": "01311000", "state": "SP", "city": "SP", "street": "R", "number": "1",
                "complement": "", "district": "D",
            },
        }
        order = http.post(f"{API}/orders", json=payload).json()
        r = http.post(f"{API}/payments/mercadopago/preference", json={"order_number": order["number"]})
        assert r.status_code == 503

    def test_webhook_rejects_invalid_signature(self, http):
        r = requests.post(
            f"{API}/payments/mercadopago/webhook",
            json={"type": "payment", "data": {"id": "123"}},
            headers={"x-signature": "ts=1,v1=abc"},
        )
        assert r.status_code == 401


# --------------------- admin CRUD ---------------------
class TestAdminCRUD:
    def test_product_crud_and_price_history(self, admin_token):
        headers = {"Authorization": f"Bearer {admin_token}"}
        payload = {"name": f"TEST Produto {uuid.uuid4().hex[:6]}", "category": "acessorios", "price": 100.0, "stock": 5, "product_type": "own_store"}
        r = requests.post(f"{API}/admin/products", json=payload, headers=headers)
        assert r.status_code == 200
        pid = r.json()["id"]
        # update price -> should create price history entry
        r2 = requests.put(f"{API}/admin/products/{pid}", json={**payload, "price": 90.0}, headers=headers)
        assert r2.status_code == 200
        # verify history via product detail
        slug = r2.json()["slug"]
        det = requests.get(f"{API}/products/{slug}").json()
        assert len(det["price_history"]) >= 1
        # update stock
        rs = requests.put(f"{API}/admin/products/{pid}/stock", json={"stock": 20, "min_stock": 4}, headers=headers)
        assert rs.status_code == 200
        # delete
        rd = requests.delete(f"{API}/admin/products/{pid}", headers=headers)
        assert rd.status_code == 200

    def test_inventory_status(self, admin_token):
        r = requests.get(f"{API}/admin/inventory", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        for item in r.json():
            assert item["stock_status"] in ("Parceiro", "Esgotado", "Estoque baixo", "Disponível")

    def test_dashboard(self, admin_token):
        r = requests.get(f"{API}/admin/dashboard", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        j = r.json()
        for k in ("revenue", "orders_count", "products_count", "customers_count", "top_products", "low_stock", "revenue_series"):
            assert k in j


# --------------------- reviews & support ---------------------
class TestReviewsSupport:
    def test_create_review_pending_and_moderate(self, admin_token, customer_token, products):
        # pick product that customer has NOT purchased
        target = next((p for p in products if p["product_type"] == "own_store"), None)
        assert target
        r = requests.post(
            f"{API}/reviews",
            json={"product_id": target["id"], "rating": 5, "comment": "Excelente produto para teste"},
            headers={"Authorization": f"Bearer {customer_token}"},
        )
        assert r.status_code == 200
        rev = r.json()["review"]
        assert rev["status"] == "pending"
        # verified_purchase should be False since customer hasn't necessarily bought THIS product
        # not strictly asserted (previous tests may have created paid orders); just ensure it's boolean
        assert isinstance(rev["verified_purchase"], bool)

        # approve
        rid = rev["id"]
        ra = requests.put(f"{API}/admin/reviews/{rid}", json={"status": "approved"}, headers={"Authorization": f"Bearer {admin_token}"})
        assert ra.status_code == 200

        # appears in product
        det = requests.get(f"{API}/products/{target['slug']}").json()
        assert any(rv["id"] == rid for rv in det["reviews"])

        # cleanup
        requests.delete(f"{API}/admin/reviews/{rid}", headers={"Authorization": f"Bearer {admin_token}"})

    def test_support_message(self, admin_token):
        r = requests.post(f"{API}/support", json={"name": "T", "email": "t@t.com", "subject": "Ola", "message": "Mensagem de teste"})
        assert r.status_code == 200
        r2 = requests.get(f"{API}/admin/support", headers={"Authorization": f"Bearer {admin_token}"})
        assert r2.status_code == 200
        assert any(m["subject"] == "Ola" for m in r2.json())
