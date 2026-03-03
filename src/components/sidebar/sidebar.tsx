//components/sidebar/sidebar.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
} from "lucide-react";

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

  const sections = [
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
            },
            {
              label: "Eventos Públicos",
              href: "/dashboard/publico/eventos",
              icon: CalendarDays,
            },
            {
              label: "Cronograma Semanal",
              href: "/dashboard/publico/cronograma-semanal",
              icon: CalendarDays,
            },
            {
              label: "Cronograma Anual",
              href: "/dashboard/publico/cronograma-anual",
              icon: CalendarDays,
            },
          ],
        },
      ],
    },
    {
      title: "ADMINISTRAÇÃO",
      items: [
        { label: "Usuários", href: "/dashboard/usuarios", icon: Users },
        {
          label: "Secretaria",
          icon: Church,
          children: [
            { label: "Membros", href: "/secretaria/membros", icon: Users },
            { label: "Cargos", href: "/secretaria/cargos", icon: Briefcase },
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
        },
        {
          label: "Backup",
          href: "/backup",
          icon: Database,
        },
        {
          label: "Backup2",
          icon: Database,
          onClick: () => setShowModal(true),
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
            },
            {
              label: "Configuração",
              icon: Radio,
              onClick: () => setShowModal(true),
            },
          ],
        },
      ],
    },
  ];

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname.startsWith(href);
  };

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
          {sections.map((section) => (
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
                                onClick={sub.onClick}
                              >
                                <SubIcon size={16} />
                                {sub.label}
                              </button>
                            ) : (
                              <Link
                                key={sub.href}
                                href={sub.href}
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
                      item.onClick?.(); // abre modal
                      onClose(); // fecha sidebar
                    }}
                  >
                    <Icon size={18} />
                    {item.label}
                  </button>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href!} // ✅ o "!" garante que não é undefined
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

      {/* ================= MODAL ================= */}
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
