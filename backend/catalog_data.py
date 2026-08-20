"""Catálogo real da BRAZA TECH — baseado no PDF "Lista Fornecedores Atualizada" enviado pelo lojista.

Regras seguidas:
- O PDF traz apenas FAIXA de preço (mínimo e máximo). Nada de preço exato inventado:
  `price` recebe o valor mínimo e é marcado como demonstrativo (`price_is_demo`) até o
  administrador definir o preço final no painel. `price_min`/`price_max` guardam a faixa.
- Todos os itens são do tipo `affiliate` (venda concluída no fornecedor via link do PDF).
- `supplier_cost` e `supplier_coupon` (investimento e cupom do fornecedor) são dados internos
  e NUNCA são expostos nas rotas públicas.
- Nenhuma especificação, imagem, avaliação ou garantia foi inventada.
"""

NO_INFO = "Informação não informada pelo fornecedor."
SHORT = "Produto da curadoria Braza Tech. Especificações completas disponíveis no site do fornecedor."
CATALOG_VERSION = "fornecedores-v1"

EXTRA_CATEGORIES = [
    {"slug": "carrinhos", "name": "Carrinhos", "icon": "Car", "order": 14},
    {"slug": "eletronicos", "name": "Eletrônicos", "icon": "Zap", "order": 15},
    {"slug": "blocos-de-montar", "name": "Blocos de Montar", "icon": "Blocks", "order": 16},
    {"slug": "relogios", "name": "Relógios", "icon": "Watch", "order": 17},
    {"slug": "outros", "name": "Outros", "icon": "Package", "order": 18},
]

# (nome, categoria, preço mínimo, preço máximo, link de afiliado, investimento, cupom)
CATALOG = [
    ("Carrinho de Controle Remoto Dk087 (DK087 Blue 1B FB)", "carrinhos", 149.0, 179.0, "https://s.click.aliexpress.com/e/oESFSa9", 87.13, "Frete Grátis (Método)"),
    ("Carro de Drift GTR PRO Black 4wd", "carrinhos", 199.0, 249.0, "https://s.click.aliexpress.com/e/oEnQc2N", 106.69, "Frete Grátis (Método)"),
    ("Carrinho de Controle Remoto 4x4 Rock Crawler 37cm", "carrinhos", 299.0, 399.0, "https://s.click.aliexpress.com/e/okw18jl", 176.44, "IFP1SID"),

    ("Drone 99 Black (4K single camera)", "drones", 149.0, 199.0, "https://s.click.aliexpress.com/e/olpQiv3", 78.06, "Frete Grátis (Método)"),
    ("Drone V88 (8K Dual Grey Bag)", "drones", 279.0, 299.0, "https://s.click.aliexpress.com/e/oC3ShAB", 116.18, "Frete Grátis (Método)"),
    ("Drone GT3 (6K-GREY-1B)", "drones", 299.0, 349.0, "https://s.click.aliexpress.com/e/okielqT", 143.04, "IFP1SID"),
    ("Drone P11 Max RC com Sensor de Obstáculos (Orange single 4K)", "drones", 249.0, 299.0, "https://s.click.aliexpress.com/e/okkbvtx", 139.20, "IFP1SID"),
    ("Drone G6 (Yellow-Dual6K-Bag-1B)", "drones", 279.0, 349.0, "https://s.click.aliexpress.com/e/oFHMjWR", 141.97, "Frete Grátis (Método)"),
    ("Drone F198 com Motor Brushless e Fluxo Óptico (Dual-OF-1B)", "drones", 249.0, 299.0, "https://s.click.aliexpress.com/e/oFzr2jz", 145.98, "IFPUN11"),
    ("Drone L106 Max (Black Dual 8K 1B)", "drones", 299.0, 349.0, "https://s.click.aliexpress.com/e/oolzKjV", 149.13, "IFP1SID"),
    ("Drone H16 com Motor Brushless (Black-8K-1B)", "drones", 249.0, 299.0, "https://s.click.aliexpress.com/e/oC0mWCX", 156.74, "IFP1SID"),
    ("Drone KBDFA K102 Pro com Sensor de Obstáculos e Fluxo Óptico (Black-1Battery)", "drones", 299.0, 399.0, "https://s.click.aliexpress.com/e/om4HVsX", 159.22, "IFP1SID"),
    ("Drone K13 Max RC (K13MAX 6K 1B)", "drones", 399.0, 449.0, "https://s.click.aliexpress.com/e/okh9s6X", 169.93, "IFP1SID"),
    ("Drone S1S com Motor Brushless", "drones", 349.0, 399.0, "https://s.click.aliexpress.com/e/oockWCv", 194.57, "IFP1SID"),
    ("Drone KBDFA F200 com Motor Brushless e Sensor de Obstáculos (Black-DC-4K-1B)", "drones", 399.0, 449.0, "https://s.click.aliexpress.com/e/ol090Ot", 187.82, "IFP1SID"),
    ("Drone Z16 Pro com Motor Brushless (Z16 PRO 4K 1B)", "drones", 349.0, 399.99, "https://s.click.aliexpress.com/e/oFGmMyX", 194.57, "IFP1SID"),
    ("Drone L900 Pro SE (L900PROSE Orange FB)", "drones", 599.0, 699.0, "https://s.click.aliexpress.com/e/oBTq0mZ", 344.18, "IFPJ2KI"),
    ("Drone L600-1 (L600 PRO 4K 1B)", "drones", 999.0, 1499.0, "https://s.click.aliexpress.com/e/ol2hcF1", 447.93, "IFPDMDY"),

    ("Localizador Bluetooth GPS Xiaomi (White 1pcs)", "eletronicos", 39.90, 49.90, "https://s.click.aliexpress.com/e/_onz3Myf", 21.17, "Frete Grátis (Método)"),
    ("Aspirador Robótico", "eletronicos", 80.0, 120.0, "https://s.click.aliexpress.com/e/mNsFNqR", 27.09, "Frete Grátis (Método)"),
    ("Rastreador Magnético GPS", "eletronicos", 49.0, 69.0, "https://s.click.aliexpress.com/e/_oEgvPVd", 28.99, "Frete Grátis (Método)"),
    ("Aspirador de Pó Portátil 9000pa", "eletronicos", 49.0, 69.0, "https://s.click.aliexpress.com/e/oFm316h", 29.86, "Frete Grátis (Método)"),
    ("Câmera de Ré", "eletronicos", 59.0, 79.0, "https://s.click.aliexpress.com/e/_oFyXoOB", 33.60, "Frete Grátis"),
    ("Ventilador Portátil Umidificador", "eletronicos", 49.0, 69.0, "https://s.click.aliexpress.com/e/olksoQX", 35.62, "Frete Grátis (Método)"),
    ("Robô RC Dog", "eletronicos", 149.0, 199.0, "https://s.click.aliexpress.com/e/_ooCXKt5", 64.07, "Frete Grátis (Método)"),
    ("Mouse Razer (Black)", "eletronicos", 149.0, 199.0, "https://s.click.aliexpress.com/e/opA1hNN", 71.01, "Frete Grátis (Método)"),
    ("Adaptador sem Fio CarPlay / Android Auto", "eletronicos", 109.0, 139.0, "https://s.click.aliexpress.com/e/_onfxLpZ", 71.25, "Frete Grátis (Método)"),
    ("Fone KZ ZSN Pro (Black with mic)", "eletronicos", 149.0, 179.0, "https://s.click.aliexpress.com/e/ooq0ucd", 28.72, "Frete Grátis (Método) · OFF em R$223: IFPFBBX/IFPOYQF"),
    ("Fone QCY MeloBuds N50 (Black)", "eletronicos", 249.0, 299.0, "https://s.click.aliexpress.com/e/opc1UFN", 106.63, "IFP1SID"),

    ("Blocos de Montar Porsche 911 — 1580 peças (1580PCS Static)", "blocos-de-montar", 299.0, 399.0, "https://s.click.aliexpress.com/e/olk27vh", 130.18, "Frete Grátis (Método)"),
    ("Blocos de Montar Técnico Dodge Charger — 1077 peças", "blocos-de-montar", 299.0, 349.0, "https://s.click.aliexpress.com/e/_o2CPJeb", 126.40, "Frete Grátis (Método)"),
    ("Blocos de Montar Técnico AMG F1 — 1642 peças", "blocos-de-montar", 399.0, 499.0, "https://s.click.aliexpress.com/e/onsHRuJ", 127.72, "Frete Grátis (Método)"),

    ("Smartband M7", "relogios", 49.0, 69.0, "https://s.click.aliexpress.com/e/oDCNM0b", 27.89, "Frete Grátis (Método)"),
    ("Relógio Smartwatch com 7 Pulseiras (S900)", "relogios", 99.0, 149.0, "https://s.click.aliexpress.com/e/onMVge3", 57.90, "Frete Grátis (Método)"),
    ("Relógio Smartwatch (W700)", "relogios", 99.0, 149.0, "https://s.click.aliexpress.com/e/oCYQ9NB", 51.39, "Frete Grátis (Método)"),
    ("Smartwatch Zeblaze BTalk 3 Plus", "relogios", 149.0, 199.0, "https://s.click.aliexpress.com/e/olCZd", 102.17, "Frete Grátis (Método)"),
    ("Relógio Smartwatch 1800 Ultra — atacado 10 peças (5Pk 5Wh)", "relogios", 69.0, 79.0, "https://s.click.aliexpress.com/e/oBhOZII", 398.42, "IFPQB7F"),

    ("Mouse Pad", "outros", 29.0, 34.90, "https://s.click.aliexpress.com/e/_oBA2pRx", 16.05, "Frete Grátis (Método)"),
    ("Plantinha Decorativa", "outros", 39.0, 49.0, "https://s.click.aliexpress.com/e/oEZdN9d", 16.26, "Frete Grátis (Método)"),
    ("Óculos de Ciclismo", "outros", 39.0, 49.0, "https://s.click.aliexpress.com/e/omG09DH", 18.41, "Frete Grátis (Método)"),
    ("Boné Kairui Preto", "outros", 49.0, 59.0, "https://s.click.aliexpress.com/e/olUipCz", 21.78, "Ofertas de combo"),
    ("Arma de Água Automática Elétrica (Red, Green, Blue)", "outros", 149.0, 199.0, "https://s.click.aliexpress.com/e/_ook3PXx", 57.40, "Frete Grátis (Método)"),
]


def catalog_items():
    """Converte o catálogo em payloads prontos para `normalize_product`."""
    items = []
    for index, (name, category, price_min, price_max, url, cost, coupon) in enumerate(CATALOG):
        items.append(
            {
                "name": name,
                "category": category,
                "price": price_min,
                "price_min": price_min,
                "price_max": price_max,
                "price_is_demo": True,
                "short_description": SHORT,
                "description": f"{SHORT} {NO_INFO}",
                "specs": [{"label": "Especificações técnicas", "value": NO_INFO}],
                "includes": [NO_INFO],
                "warranty": NO_INFO,
                "brand": NO_INFO,
                "model": NO_INFO,
                "image": "",
                "gallery": [],
                "sku": f"BT-{2000 + index}",
                "stock": 0,
                "product_type": "affiliate",
                "affiliate_url": url,
                "affiliate_network": "AliExpress",
                "supplier": "AliExpress",
                "supplier_cost": cost,
                "supplier_coupon": coupon,
                "source": "catalog_fornecedores_v1",
                "keywords": [w for w in name.lower().replace("(", " ").replace(")", " ").split() if len(w) > 2],
            }
        )
    return items
