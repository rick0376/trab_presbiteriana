//components/sidebar/sidebar.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import styles from "./styles.module.scss";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Church,
  ShieldCheck,
  Database,
  ChevronDown,
  ChevronRight,
  X,
  Briefcase,
  BadgeDollarSign,
  Radio,
  GraduationCap,
  Building2,
  Music4,
} from "lucide-react";

type Permissao = {
  recurso: string;
  ler: boolean;
  criar: boolean;
  editar: boolean;
  deletar: boolean;
  compartilhar: boolean;
};

type MeResponse = {
  id: string;
  role: string;
};

type MenuChild = {
  label: string;
  href?: string;
  icon: any;
  onClick?: () => void;
  recurso?: string;
};

type MenuItem = {
  label: string;
  href?: string;
  icon: any;
  onClick?: () => void;
  children?: MenuChild[];
  recurso?: string;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

export default function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>("");
  const [showModal, setShowModal] = useState(false);

  const [me, setMe] = useState<MeResponse | null>(null);
  const [permissoes, setPermissoes] = useState<Record<string, Permissao>>({});
  const [loadingPerms, setLoadingPerms] = useState(true);

  useEffect(() => {
    async function loadPerms() {
      try {
        const meRes = await fetch("/api/me", { cache: "no-store" });

        if (!meRes.ok) {
          setLoadingPerms(false);
          return;
        }

        const meData: MeResponse = await meRes.json();
        setMe(meData);

        if (meData.role === "SUPERADMIN") {
          setLoadingPerms(false);
          return;
        }

        const permRes = await fetch(`/api/permissoes?userId=${meData.id}`, {
          cache: "no-store",
        });

        if (!permRes.ok) {
          setLoadingPerms(false);
          return;
        }

        const list: Permissao[] = await permRes.json();

        const map: Record<string, Permissao> = {};
        list.forEach((item) => {
          map[item.recurso] = item;
        });

        setPermissoes(map);
      } catch {
      } finally {
        setLoadingPerms(false);
      }
    }

    loadPerms();
  }, []);

  function canView(recurso?: string) {
    if (!recurso) return true;
    if (me?.role === "SUPERADMIN") return true;
    return !!permissoes[recurso]?.ler;
  }

  const sections: MenuSection[] = [
    {
      title: "VISÃO GERAL",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "COMUNICAÇÃO",
      items: [
        {
          label: "Conteúdo Geral",
          icon: CalendarDays,
          children: [
            {
              label: "Banner e Horários Cultos",
              href: "/dashboard/publico/conteudo-publico",
              icon: CalendarDays,
              recurso: "publico",
            },
            {
              label: "Eventos Públicos",
              href: "/dashboard/publico/eventos",
              icon: CalendarDays,
              recurso: "eventos_publico",
            },
            {
              label: "Cronograma Semanal",
              href: "/dashboard/publico/cronograma-semanal",
              icon: CalendarDays,
              recurso: "cronograma_publico",
            },
            {
              label: "Cronograma Anual",
              href: "/dashboard/publico/cronograma-anual",
              icon: CalendarDays,
              recurso: "cronograma_anual",
            },
            {
              label: "Departamentos",
              href: "/dashboard/publico/departamentos",
              icon: Building2,
              recurso: "departamentos",
            },
            {
              label: "Álbuns Departamentos",
              href: "/dashboard/publico/departamentos/albuns",
              icon: CalendarDays,
              recurso: "departamentos_albuns",
            },
            {
              label: "História da Igreja",
              href: "/dashboard/publico/historia",
              icon: CalendarDays,
              recurso: "historia_igreja",
            },
          ],
        },
      ],
    },
    {
      title: "ADMINISTRAÇÃO",
      items: [
        {
          label: "Usuários",
          href: "/dashboard/usuarios",
          icon: Users,
          recurso: "usuarios",
        },
        {
          label: "Secretaria",
          icon: Church,
          children: [
            {
              label: "Membros",
              href: "/secretaria/membros",
              icon: Users,
              recurso: "membros",
            },
            {
              label: "Cargos",
              href: "/secretaria/cargos",
              icon: Briefcase,
              recurso: "cargos",
            },
            {
              label: "Escola Dominical",
              href: "/secretaria/escola-dominical",
              icon: GraduationCap,
              recurso: "escola_dominical",
            },
            {
              label: "Hinários",
              href: "/secretaria/hinarios",
              icon: Music4,
              recurso: "hinarios",
            },
            {
              label: "Financeiro",
              href: "/secretaria/financeiro",
              icon: BadgeDollarSign,
              onClick: () => setShowModal(true),
            },
          ],
        },
        {
          label: "Permissões",
          href: "/dashboard/permissoes",
          icon: ShieldCheck,
          recurso: "permissoes",
        },
        {
          label: "Backup",
          href: "/backup",
          icon: Database,
          recurso: "backup",
        },
      ],
    },
    {
      title: "RÁDIO",
      items: [
        {
          label: "Rádio",
          icon: Radio,
          children: [
            {
              label: "Painel da Rádio",
              href: "/radio/admin",
              icon: Radio,
              recurso: "radio_live",
            },
            {
              label: "Programação da Rádio",
              href: "/radio/admin-radio/programacao",
              icon: Radio,
              recurso: "radio_live",
            },
            {
              label: "Configuração",
              icon: Radio,
              onClick: () => setShowModal(true),
              recurso: "radio_url",
            },
          ],
        },
      ],
    },
  ];

  const filteredSections = useMemo(() => {
    return sections
      .map((section) => {
        const filteredItems = section.items
          .map((item) => {
            if (item.children?.length) {
              const visibleChildren = item.children.filter((child) =>
                canView(child.recurso),
              );

              if (!visibleChildren.length) return null;

              return {
                ...item,
                children: visibleChildren,
              };
            }

            if (!canView(item.recurso)) return null;

            return item;
          })
          .filter(Boolean) as MenuItem[];

        if (!filteredItems.length) return null;

        return {
          ...section,
          items: filteredItems,
        };
      })
      .filter(Boolean) as MenuSection[];
  }, [sections, permissoes, me]);

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname.startsWith(href);
  };

  if (loadingPerms) {
    return (
      <>
        <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
          <div className={styles.header}>
            <div className={styles.logoBox}>
              <span className={styles.logoText}>IPR</span>
            </div>
            <div className={styles.titleBox}>
              <strong>Painel</strong>
              <span>Administrativo</span>
            </div>

            <button className={styles.closeBtn} onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <div className={styles.footer}>Carregando menu...</div>
        </aside>

        {isOpen && <div className={styles.overlay} onClick={onClose} />}
      </>
    );
  }

  return (
    <>
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        <div className={styles.header}>
          <div className={styles.logoBox}>
            <span className={styles.logoText}>IPR</span>
          </div>
          <div className={styles.titleBox}>
            <strong>Painel</strong>
            <span>Administrativo</span>
          </div>

          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <nav className={styles.nav}>
          {filteredSections.map((section) => (
            <div key={section.title} className={styles.group}>
              <div className={styles.groupTitle}>{section.title}</div>

              {section.items.map((item) => {
                const Icon = item.icon;

                if (item.children) {
                  const expanded = openMenu === item.label;

                  return (
                    <div key={item.label}>
                      <button
                        className={styles.menuButton}
                        onClick={() =>
                          setOpenMenu(expanded ? null : item.label)
                        }
                      >
                        <div className={styles.menuLeft}>
                          <Icon size={18} />
                          <span>{item.label}</span>
                        </div>

                        {expanded ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </button>

                      {expanded && (
                        <div className={styles.subMenu}>
                          {item.children.map((sub) => {
                            const SubIcon = sub.icon;

                            return sub.onClick ? (
                              <button
                                key={sub.label}
                                className={styles.navItem}
                                onClick={() => {
                                  sub.onClick?.();
                                  onClose();
                                }}
                              >
                                <SubIcon size={16} />
                                {sub.label}
                              </button>
                            ) : (
                              <Link
                                key={sub.href}
                                href={sub.href!}
                                className={`${styles.subItem} ${
                                  isActive(sub.href) ? styles.active : ""
                                }`}
                                onClick={onClose}
                              >
                                <SubIcon size={16} />
                                {sub.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return item.onClick ? (
                  <button
                    key={item.label}
                    className={styles.navItem}
                    onClick={() => {
                      item.onClick?.();
                      onClose();
                    }}
                  >
                    <Icon size={18} />
                    {item.label}
                  </button>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href!}
                    className={`${styles.navItem} ${
                      isActive(item.href) ? styles.active : ""
                    }`}
                    onClick={onClose}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={styles.footer}>“Tudo para a glória de Deus”</div>
      </aside>

      {isOpen && <div className={styles.overlay} onClick={onClose} />}

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Página em Construção 🚧</h2>
            <p>Estamos trabalhando para disponibilizar esta seção em breve!</p>
            <button
              className={styles.modalClose}
              onClick={() => setShowModal(false)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
