// Governo do Futuro · Plataforma — tipos dos componentes (window.GovFuturo).
// React 18 é carregado pela página; os componentes não importam nada.
import type * as React from 'react';

export type IconName =
  | 'home' | 'search' | 'plus' | 'check' | 'x' | 'chevron-right' | 'chevron-left' | 'chevron-down' | 'menu'
  | 'info' | 'check-circle' | 'alert' | 'x-circle' | 'lock' | 'users' | 'user' | 'file' | 'upload' | 'download'
  | 'chat' | 'sparkles' | 'clock' | 'chart' | 'settings' | 'log-out' | 'external' | 'edit' | 'trash' | 'filter'
  | 'calendar' | 'building' | 'briefcase' | 'lightbulb' | 'send' | 'eye';

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface IconProps {
  name: IconName;
  /** Lado em px. Padrão 20 (use 16, 20 ou 24). */
  size?: number;
  /** Texto para leitor de tela. Sem ele o ícone é decorativo (aria-hidden). */
  label?: string;
  strokeWidth?: number;
  className?: string;
}

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  /** primary = ação principal da tela (uma por área); accent = destaque em fundo navy; danger = ação destrutiva. */
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  iconRight?: IconName;
  /** Mostra o indicador de carregamento e desabilita o botão. */
  loading?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  /** Botão só com ícone exige aria-label. */
  'aria-label'?: string;
}

interface FieldBase {
  label?: React.ReactNode;
  /** Texto de apoio abaixo do campo. Some quando há erro. */
  hint?: React.ReactNode;
  /** Mensagem de erro: diga o que corrigir, não só que está errado. */
  error?: React.ReactNode;
  required?: boolean;
  /** Marca o campo como "(opcional)". Use quando a maioria dos campos é obrigatória. */
  optional?: boolean;
  id?: string;
  className?: string;
}

export interface TextFieldProps extends FieldBase,
  Omit<React.InputHTMLAttributes<HTMLInputElement> & React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className' | 'id'> {
  multiline?: boolean;
  rows?: number;
  icon?: IconName;
  type?: string;
}

export type SelectOption = string | { value: string; label: React.ReactNode; disabled?: boolean };

export interface SelectProps extends FieldBase, Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'className' | 'id'> {
  options?: SelectOption[];
  placeholder?: string;
}

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
  description?: React.ReactNode;
}

export interface RadioOption { value: string; label: React.ReactNode; description?: React.ReactNode; disabled?: boolean; }
export interface RadioGroupProps {
  legend?: React.ReactNode;
  name?: string;
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** 'row' para até 3 opções curtas; o padrão empilha. */
  direction?: 'column' | 'row';
  disabled?: boolean;
  className?: string;
}

export interface SwitchProps {
  label?: React.ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export interface BadgeProps {
  /** 'ia' marca conteúdo gerado por IA (texto padrão "IA"). */
  tone?: Tone | 'ia';
  /** Ícone próprio, ou false para esconder o do tom. */
  icon?: IconName | false;
  children?: React.ReactNode;
  className?: string;
}

export interface AlertProps {
  tone?: Exclude<Tone, 'neutral'>;
  title?: React.ReactNode;
  children?: React.ReactNode;
  /** Um botão ou link que resolve o aviso. */
  action?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export interface CardProps {
  as?: keyof React.JSX.IntrinsicElements;
  /** 'inverse' = painel navy, para destaque ou resumo. */
  variant?: 'default' | 'inverse';
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export interface TabItem { id: string; label: React.ReactNode; count?: number; content?: React.ReactNode; }
export interface TabsProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  /** Nome da lista de abas para leitor de tela. */
  label?: string;
  id?: string;
  className?: string;
}

export interface TableColumn<Row> {
  key: string;
  header: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: number | string;
  render?: (row: Row) => React.ReactNode;
}
export interface TableProps<Row extends { id?: string | number } = Record<string, any>> {
  columns: TableColumn<Row>[];
  rows: Row[];
  caption?: React.ReactNode;
  dense?: boolean;
  selectedId?: string | number;
  emptyText?: React.ReactNode;
  className?: string;
}

export interface StepItem { label: React.ReactNode; description?: React.ReactNode; /** Etapa em que a IA apoia o servidor. */ ai?: boolean; }
export interface StepperProps {
  steps: StepItem[];
  /** Índice (base 0) da etapa atual. Anteriores ficam concluídas. */
  current?: number;
  orientation?: 'horizontal' | 'vertical';
  label?: string;
  className?: string;
}

export interface ProgressBarProps {
  label?: React.ReactNode;
  value: number;
  max?: number;
  showValue?: boolean;
  /** Texto do valor (ex.: "3 de 7 etapas"). Também vai para aria-valuetext. */
  valueText?: string;
  tone?: 'info' | 'success' | 'warning' | 'danger';
  id?: string;
  className?: string;
}

export interface StatProps {
  label: React.ReactNode;
  value: React.ReactNode;
  unit?: React.ReactNode;
  delta?: React.ReactNode;
  tone?: 'positive' | 'negative' | 'neutral';
  /** Fonte do dado. Obrigatória em painéis públicos. */
  source?: React.ReactNode;
  className?: string;
}

export interface ModalProps {
  open: boolean;
  title: React.ReactNode;
  onClose?: () => void;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** false impede fechar clicando fora (use em formulários longos). */
  dismissible?: boolean;
}

export interface NavLink { label: React.ReactNode; href?: string; active?: boolean; }
export interface TopBarProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  logoSrc?: string;
  logoAlt?: string;
  homeHref?: string;
  nav?: NavLink[];
  actions?: React.ReactNode;
  user?: { name: string; role?: string };
  onMenu?: () => void;
  className?: string;
}

export interface SideNavItem { id?: string; label: React.ReactNode; icon?: IconName; badge?: React.ReactNode; active?: boolean; href?: string; }
export interface SideNavProps {
  items?: SideNavItem[];
  sections?: { title?: React.ReactNode; items: SideNavItem[] }[];
  onSelect?: (item: SideNavItem) => void;
  footer?: React.ReactNode;
  label?: string;
  className?: string;
}

export interface AISuggestionProps {
  title?: React.ReactNode;
  children: React.ReactNode;
  status?: 'pending' | 'accepted' | 'discarded';
  /** Quem revisou (mostrado quando status = 'accepted'). */
  reviewer?: string;
  /** Documentos ou bases que a IA usou. */
  sources?: string[];
  note?: React.ReactNode;
  onAccept?: () => void;
  onEdit?: () => void;
  onDiscard?: () => void;
  className?: string;
}

export interface GovFuturoAPI {
  Icon: React.FC<IconProps> & { names: IconName[] };
  Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;
  TextField: React.ForwardRefExoticComponent<TextFieldProps & React.RefAttributes<HTMLInputElement | HTMLTextAreaElement>>;
  Select: React.ForwardRefExoticComponent<SelectProps & React.RefAttributes<HTMLSelectElement>>;
  Checkbox: React.ForwardRefExoticComponent<CheckboxProps & React.RefAttributes<HTMLInputElement>>;
  RadioGroup: React.FC<RadioGroupProps>;
  Switch: React.FC<SwitchProps>;
  Badge: React.FC<BadgeProps>;
  Alert: React.FC<AlertProps>;
  Card: React.FC<CardProps>;
  Tabs: React.FC<TabsProps>;
  Table: <Row extends { id?: string | number }>(props: TableProps<Row>) => React.ReactElement;
  Stepper: React.FC<StepperProps>;
  ProgressBar: React.FC<ProgressBarProps>;
  Stat: React.FC<StatProps>;
  Modal: React.FC<ModalProps>;
  TopBar: React.FC<TopBarProps>;
  SideNav: React.FC<SideNavProps>;
  AISuggestion: React.FC<AISuggestionProps>;
}

declare global {
  interface Window { GovFuturo: GovFuturoAPI; }
}
