// Governo do Futuro · Plataforma: tokens e componentes do design system.
// A ordem importa: o React precisa estar em window antes de bundle.js.
import './react-global'
import './tokens.css'
import './bundle.css'
import './bundle.js'

export const {
  Alert,
  AISuggestion,
  Badge,
  Button,
  Card,
  Icon,
  Modal,
  ProgressBar,
  RadioGroup,
  Select,
  Stat,
  Table,
  TextField,
  TopBar,
} = window.GovFuturo
