"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./styles.module.scss";
import { useToast } from "@/components/ui/Toast/useToast";

type Igreja = { id: string; nome: string; slug: string };

export default function EditarCargoClient({
  id,
  userRole,
}: {
  id: string;
  userRole: string;
}) {
  const router = useRouter();
  const toast = useToast();

  const isSuperAdmin = userRole === "SUPERADMIN";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nome, setNome] = useState("");

  const [igrejas, setIgrejas] = useState<Igreja[]>([]);
  const [igrejaId, setIgrejaId] = useState("");

  async function load(selectedIgrejaId?: string) {
    setLoading(true);

    const qs = new URLSearchParams();
    const finalIgrejaId = selectedIgrejaId ?? igrejaId;
    if (isSuperAdmin && finalIgrejaId) qs.set("igrejaId", finalIgrejaId);

    try {
      const res = await fetch(`/api/cargos/${id}?${qs.toString()}`);

      if (!res.ok) {
        toast.error("Não foi possível carregar o cargo.", "Erro");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setNome(data?.nome || "");
      setLoading(false);
    } catch {
      toast.error("Falha de conexão ao carregar cargo.", "Erro");
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      if (isSuperAdmin) {
        try {
          const r = await fetch("/api/igrejas");
          if (!r.ok) {
            toast.error("Não foi possível carregar as igrejas.", "Erro");
            setLoading(false);
            return;
          }

          const j = await r.json();
          if (Array.isArray(j)) {
            setIgrejas(j);
            const first = j[0]?.id || "";
            setIgrejaId(first);
            await load(first);
            return;
          }

          toast.error("Resposta inválida ao carregar igrejas.", "Erro");
          setLoading(false);
          return;
        } catch {
          toast.error("Falha de conexão ao carregar igrejas.", "Erro");
          setLoading(false);
          return;
        }
      }

      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();

    if (!nome.trim()) {
      toast.info("Informe o nome do cargo.", "Atenção");
      return;
    }

    setSaving(true);

    const qs = new URLSearchParams();
    if (isSuperAdmin && igrejaId) qs.set("igrejaId", igrejaId);

    try {
      const res = await fetch(`/api/cargos/${id}?${qs.toString()}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome }),
      });

      setSaving(false);

      if (!res.ok) {
        const text = await res.text();
        const json = text ? JSON.parse(text) : {};
        toast.error(json?.error || "Erro ao salvar.", "Erro");
        return;
      }

      toast.success("Cargo atualizado com sucesso!", "Sucesso");

      setTimeout(() => {
        router.replace("/secretaria/cargos");
      }, 650);
    } catch {
      setSaving(false);
      toast.error("Falha de conexão ao salvar.", "Erro");
    }
  }

  if (loading) return <div className={styles.loading}>Carregando...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <button
          className={styles.back}
          type="button"
          onClick={() => router.back()}
          disabled={saving}
        >
          ← Voltar
        </button>

        <div className={styles.headerRight}>
          <h1 className={styles.h1Editar}>Editar Cargo</h1>
          <div className={styles.sub}>
            Atualize o nome do cargo com segurança.
          </div>
        </div>
      </div>

      <form className={styles.form} onSubmit={save}>
        {isSuperAdmin && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Igreja</div>

            <select
              className={styles.input}
              value={igrejaId}
              onChange={(e) => {
                const id = e.target.value;
                setIgrejaId(id);
                load(id);
              }}
              disabled={saving}
            >
              {igrejas.length === 0 ? (
                <option value="">Carregando igrejas...</option>
              ) : (
                igrejas.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nome} ({i.slug})
                  </option>
                ))
              )}
            </select>
          </div>
        )}

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Dados do Cargo</div>

          <div className={styles.field}>
            <label className={styles.label}>
              Nome <span className={styles.req}>*</span>
            </label>

            <input
              className={styles.input}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Pastor, Diácono, Secretário..."
              disabled={saving}
            />
          </div>
        </div>

        <button className={styles.btn} disabled={saving}>
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </form>
    </div>
  );
}
