import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, brl } from "@/lib/api";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/admin/dashboard").then((r) => setData(r.data)); }, []);
  if (!data) return <div className="bt-card rounded-xl h-64 animate-pulse" />;

  const cards = [
    ["Faturamento", brl(data.revenue)],
    ["Pedidos", data.orders_count],
    ["Produtos", data.products_count],
    ["Clientes", data.customers_count],
    ["Ticket médio", brl(data.avg_ticket)],
    ["Pedidos pendentes", data.pending_orders.length],
  ];

  return (
    <div data-testid="admin-dashboard">
      <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
      {data.demo_mode && (
        <p className="mt-3 text-xs bg-[#0077FF]/10 border border-[#0077FF]/40 text-[#00C2FF] rounded-lg px-3 py-2 inline-block" data-testid="demo-badge">
          DEMO MODE ativo — catálogo com preços demonstrativos. Métricas refletem apenas dados reais registrados no banco.
        </p>
      )}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map(([label, value]) => (
          <div key={label} className="bt-card rounded-xl p-4" data-testid={`kpi-${label.toLowerCase().replace(/\s/g, "-")}`}>
            <p className="text-xs uppercase tracking-[0.15em] text-[#8B95A1]">{label}</p>
            <p className="mt-2 text-xl sm:text-2xl font-bold font-display">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-4">
        <div className="bt-card rounded-xl p-4">
          <h2 className="font-display font-semibold">Faturamento (últimos registros)</h2>
          {data.revenue_series.length === 0 ? <p className="mt-3 text-sm text-[#8B95A1]">Ainda não há pedidos pagos registrados.</p> : (
            <div className="h-56 mt-4">
              <ResponsiveContainer>
                <LineChart data={data.revenue_series}>
                  <CartesianGrid stroke="#2A2F36" vertical={false} />
                  <XAxis dataKey="date" stroke="#8B95A1" fontSize={11} />
                  <YAxis stroke="#8B95A1" fontSize={11} />
                  <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2A2F36" }} />
                  <Line type="monotone" dataKey="revenue" stroke="#00C2FF" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="bt-card rounded-xl p-4">
          <h2 className="font-display font-semibold">Produtos mais vendidos</h2>
          {data.top_products.length === 0 ? <p className="mt-3 text-sm text-[#8B95A1]">Nenhuma venda registrada ainda.</p> : (
            <div className="h-56 mt-4">
              <ResponsiveContainer>
                <BarChart data={data.top_products}>
                  <CartesianGrid stroke="#2A2F36" vertical={false} />
                  <XAxis dataKey="name" stroke="#8B95A1" fontSize={10} hide />
                  <YAxis stroke="#8B95A1" fontSize={11} />
                  <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2A2F36" }} />
                  <Bar dataKey="quantity" fill="#0077FF" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-4">
        <div className="bt-card rounded-xl p-4">
          <h2 className="font-display font-semibold">Estoque baixo</h2>
          {data.low_stock.length === 0 ? <p className="mt-3 text-sm text-[#8B95A1]">Nenhum produto em nível crítico.</p> : (
            <ul className="mt-3 text-sm divide-y divide-[#2A2F36]">
              {data.low_stock.map((p) => <li key={p.slug} className="py-2 flex justify-between"><span>{p.name}</span><span className="text-[#E53E3E]">{p.stock} un.</span></li>)}
            </ul>
          )}
        </div>
        <div className="bt-card rounded-xl p-4">
          <h2 className="font-display font-semibold">Pedidos pendentes</h2>
          {data.pending_orders.length === 0 ? <p className="mt-3 text-sm text-[#8B95A1]">Nenhum pedido pendente.</p> : (
            <ul className="mt-3 text-sm divide-y divide-[#2A2F36]">
              {data.pending_orders.map((o) => <li key={o.id} className="py-2 flex justify-between"><span>{o.number}</span><span>{brl(o.total)}</span></li>)}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
