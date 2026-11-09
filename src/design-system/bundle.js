/* @ds-bundle: {"format":4,"namespace":"GovFuturo","components":[{"name":"Button"},{"name":"Icon"},{"name":"TextField"},{"name":"Select"},{"name":"Checkbox"},{"name":"RadioGroup"},{"name":"Switch"},{"name":"Badge"},{"name":"Alert"},{"name":"Card"},{"name":"Tabs"},{"name":"Table"},{"name":"Stepper"},{"name":"ProgressBar"},{"name":"Stat"},{"name":"Modal"},{"name":"TopBar"},{"name":"SideNav"},{"name":"AISuggestion"}]} */
(function () {
  'use strict';
  var R = window.React;
  if (!R) {
    if (window.console) console.error('GovFuturo: carregue o React 18 antes de bundle.js.');
    return;
  }
  var h = R.createElement;
  var ICONS = {"home":[["path","M3 11l9-7 9 7"],["path","M5 10v10h14V10"],["path","M10 20v-6h4v6"]],"search":[["circle",11,11,7],["path","M20 20l-4-4"]],"plus":[["path","M12 5v14M5 12h14"]],"check":[["path","M20 6L9 17l-5-5"]],"x":[["path","M6 6l12 12M18 6L6 18"]],"chevron-right":[["path","M9 6l6 6-6 6"]],"chevron-left":[["path","M15 6l-6 6 6 6"]],"chevron-down":[["path","M6 9l6 6 6-6"]],"menu":[["path","M4 6h16M4 12h16M4 18h16"]],"info":[["circle",12,12,9],["path","M12 11v5"],["path","M12 7.5v.5"]],"check-circle":[["circle",12,12,9],["path","M8 12l3 3 5-6"]],"alert":[["path","M12 3l10 18H2z"],["path","M12 10v4"],["path","M12 17.5v.5"]],"x-circle":[["circle",12,12,9],["path","M9 9l6 6M15 9l-6 6"]],"lock":[["rect",5,11,14,10,2],["path","M8 11V7a4 4 0 0 1 8 0v4"]],"users":[["circle",9,8,3],["path","M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"],["circle",17,9,2.5],["path","M15.5 14.2c3 .4 5.5 2.6 5.5 5.8"]],"user":[["circle",12,8,4],["path","M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"]],"file":[["path","M14 3H6v18h12V7z"],["path","M14 3v4h4"]],"upload":[["path","M12 16V4"],["path","M7 9l5-5 5 5"],["path","M4 20h16"]],"download":[["path","M12 4v12"],["path","M7 11l5 5 5-5"],["path","M4 20h16"]],"chat":[["path","M21 12a8 8 0 0 1-11.6 7.1L4 20l1-5A8 8 0 1 1 21 12z"]],"sparkles":[["path","M11 3l1.8 4.7L17.5 9.5l-4.7 1.8L11 16l-1.8-4.7L4.5 9.5l4.7-1.8z"],["path","M18.5 14l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"]],"clock":[["circle",12,12,9],["path","M12 7v5l3 2"]],"chart":[["path","M4 20V11M10 20V5M16 20v-6M2 20h20"]],"settings":[["circle",12,12,3],["path","M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"]],"log-out":[["path","M15 4h4v16h-4"],["path","M10 8l-4 4 4 4"],["path","M6 12h11"]],"external":[["path","M14 4h6v6"],["path","M20 4l-9 9"],["path","M18 14v6H4V6h6"]],"edit":[["path","M4 20h4L19 9l-4-4L4 16z"],["path","M13 7l4 4"]],"trash":[["path","M4 7h16"],["path","M9 7V4h6v3"],["path","M6 7l1 13h10l1-13"]],"filter":[["path","M3 5h18l-7 8v6l-4 2v-8z"]],"calendar":[["rect",3,5,18,16,2],["path","M3 10h18M8 3v4M16 3v4"]],"building":[["path","M4 21V6l8-3 8 3v15"],["path","M2 21h20"],["path","M10 21v-5h4v5"],["path","M8 9h1M15 9h1M8 13h1M15 13h1"]],"briefcase":[["rect",3,7,18,13,2],["path","M9 7V5h6v2"],["path","M3 13h18"]],"lightbulb":[["path","M9 18h6M10 21h4"],["path","M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"]],"send":[["path","M22 3L11 13"],["path","M22 3l-7 18-4-8-8-4z"]],"eye":[["path","M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"],["circle",12,12,3]]};

  function cx() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) { if (arguments[i]) out.push(arguments[i]); }
    return out.join(' ');
  }
  function omit(obj, keys) {
    var o = {};
    for (var k in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, k) && keys.indexOf(k) < 0) o[k] = obj[k];
    }
    return o;
  }
  function useAutoId(given, prefix) {
    var auto = R.useId();
    return given || (prefix + '-' + auto.replace(/[^a-zA-Z0-9_-]/g, ''));
  }
  function initials(name) {
    return String(name || '').split(/\s+/).filter(function (p) { return /^[A-Za-zÀ-ÿ]/.test(p) && !/\.$/.test(p); })
      .slice(0, 2).map(function (p) { return p.charAt(0).toUpperCase(); }).join('');
  }

  /* Icon ------------------------------------------------------------ */
  function Icon(props) {
    var size = props.size || 20;
    var shapes = ICONS[props.name] || [];
    var kids = shapes.map(function (s, i) {
      if (s[0] === 'path') return h('path', { key: i, d: s[1] });
      if (s[0] === 'circle') return h('circle', { key: i, cx: s[1], cy: s[2], r: s[3] });
      if (s[0] === 'rect') return h('rect', { key: i, x: s[1], y: s[2], width: s[3], height: s[4], rx: s[5] });
      return null;
    });
    var a11y = props.label ? { role: 'img', 'aria-label': props.label } : { 'aria-hidden': 'true', focusable: 'false' };
    return h('svg', Object.assign({
      className: cx('gf-icon', props.className), width: size, height: size, viewBox: '0 0 24 24',
      fill: 'none', stroke: 'currentColor', strokeWidth: props.strokeWidth || 1.8,
      strokeLinecap: 'round', strokeLinejoin: 'round'
    }, a11y), kids);
  }
  Icon.names = Object.keys(ICONS);

  /* Button ---------------------------------------------------------- */
  var Button = R.forwardRef(function Button(props, ref) {
    var variant = props.variant || 'secondary';
    var size = props.size || 'md';
    var iconSize = size === 'sm' ? 16 : 20;
    var onlyIcon = props.children == null && !!(props.icon || props.iconRight);
    var rest = omit(props, ['variant', 'size', 'icon', 'iconRight', 'loading', 'fullWidth', 'className', 'children', 'type', 'disabled']);
    return h('button', Object.assign({}, rest, {
      ref: ref,
      type: props.type || 'button',
      className: cx('gf-btn', 'gf-btn--' + variant, 'gf-btn--' + size, props.fullWidth && 'gf-btn--full', onlyIcon && 'gf-btn--icon', props.loading && 'is-loading', props.className),
      disabled: !!(props.disabled || props.loading),
      'aria-busy': props.loading ? 'true' : undefined
    }),
      props.loading ? h('span', { className: 'gf-spinner', 'aria-hidden': 'true' }) : (props.icon ? h(Icon, { name: props.icon, size: iconSize }) : null),
      props.children != null ? h('span', { className: 'gf-btn__label' }, props.children) : null,
      props.iconRight ? h(Icon, { name: props.iconRight, size: iconSize }) : null);
  });
  Button.displayName = 'Button';

  /* Field (interno) ------------------------------------------------- */
  function Field(p) {
    return h('div', { className: cx('gf-field', p.error && 'is-invalid', p.className) },
      p.label ? h('label', { className: 'gf-field__label', htmlFor: p.id }, p.label,
        p.required ? h('span', { className: 'gf-field__req', 'aria-hidden': 'true' }, ' *') : null,
        p.optional ? h('span', { className: 'gf-field__opt' }, ' (opcional)') : null) : null,
      p.control,
      p.error
        ? h('p', { className: 'gf-field__error', id: p.id + '-error' }, h(Icon, { name: 'x-circle', size: 16 }), h('span', null, p.error))
        : (p.hint ? h('p', { className: 'gf-field__hint', id: p.id + '-hint' }, p.hint) : null));
  }
  function describedBy(id, p) { return p.error ? id + '-error' : (p.hint ? id + '-hint' : undefined); }

  /* TextField ------------------------------------------------------- */
  var TextField = R.forwardRef(function TextField(props, ref) {
    var id = useAutoId(props.id, 'gf-field');
    var rest = omit(props, ['label', 'hint', 'error', 'multiline', 'rows', 'icon', 'className', 'id', 'required', 'optional', 'type']);
    var common = Object.assign({}, rest, {
      ref: ref, id: id, required: props.required,
      className: cx('gf-input', props.icon && !props.multiline && 'gf-input--with-icon', props.multiline && 'gf-input--multiline'),
      'aria-invalid': props.error ? 'true' : undefined,
      'aria-describedby': describedBy(id, props)
    });
    var control = props.multiline
      ? h('textarea', Object.assign({ rows: props.rows || 4 }, common))
      : h('input', Object.assign({ type: props.type || 'text' }, common));
    if (props.icon && !props.multiline) {
      control = h('div', { className: 'gf-input-wrap' }, h(Icon, { name: props.icon, size: 20, className: 'gf-input-wrap__icon' }), control);
    }
    return h(Field, { id: id, label: props.label, hint: props.hint, error: props.error, required: props.required, optional: props.optional, className: props.className, control: control });
  });
  TextField.displayName = 'TextField';

  /* Select ---------------------------------------------------------- */
  var Select = R.forwardRef(function Select(props, ref) {
    var id = useAutoId(props.id, 'gf-select');
    var rest = omit(props, ['label', 'hint', 'error', 'options', 'placeholder', 'className', 'id', 'required', 'optional', 'children']);
    var opts = (props.options || []).map(function (o) {
      var v = typeof o === 'string' ? { value: o, label: o } : o;
      return h('option', { key: v.value, value: v.value, disabled: v.disabled }, v.label);
    });
    if (props.placeholder) opts.unshift(h('option', { key: '__placeholder', value: '', disabled: true }, props.placeholder));
    var selProps = Object.assign({}, rest, {
      ref: ref, id: id, required: props.required, className: 'gf-select',
      'aria-invalid': props.error ? 'true' : undefined,
      'aria-describedby': describedBy(id, props)
    });
    if (selProps.value === undefined && selProps.defaultValue === undefined && props.placeholder) selProps.defaultValue = '';
    var control = h('div', { className: 'gf-select-wrap' },
      h('select', selProps, opts, props.children),
      h(Icon, { name: 'chevron-down', size: 20, className: 'gf-select-wrap__icon' }));
    return h(Field, { id: id, label: props.label, hint: props.hint, error: props.error, required: props.required, optional: props.optional, className: props.className, control: control });
  });
  Select.displayName = 'Select';

  /* Checkbox -------------------------------------------------------- */
  var Checkbox = R.forwardRef(function Checkbox(props, ref) {
    var id = useAutoId(props.id, 'gf-check');
    var rest = omit(props, ['label', 'description', 'className', 'id']);
    return h('div', { className: cx('gf-check', props.className) },
      h('input', Object.assign({}, rest, { ref: ref, id: id, type: 'checkbox', className: 'gf-check__input', 'aria-describedby': props.description ? id + '-desc' : undefined })),
      h('label', { htmlFor: id, className: 'gf-check__label' },
        h('span', { className: 'gf-check__box', 'aria-hidden': 'true' }, h(Icon, { name: 'check', size: 14, strokeWidth: 3 })),
        h('span', { className: 'gf-check__text' }, props.label)),
      props.description ? h('p', { id: id + '-desc', className: 'gf-check__desc' }, props.description) : null);
  });
  Checkbox.displayName = 'Checkbox';

  /* RadioGroup ------------------------------------------------------ */
  function RadioGroup(props) {
    var name = useAutoId(props.name, 'gf-radio');
    var controlled = props.value !== undefined;
    var st = R.useState(props.defaultValue);
    var current = controlled ? props.value : st[0];
    function change(v) { if (!controlled) st[1](v); if (props.onChange) props.onChange(v); }
    return h('fieldset', { className: cx('gf-radio-group', props.direction === 'row' && 'gf-radio-group--row', props.className), disabled: props.disabled },
      props.legend ? h('legend', { className: 'gf-field__label' }, props.legend) : null,
      h('div', { className: 'gf-radio-group__items' }, (props.options || []).map(function (o, i) {
        var id = name + '-' + i;
        return h('div', { key: o.value, className: 'gf-radio' },
          h('input', { type: 'radio', id: id, name: name, value: o.value, checked: current === o.value, disabled: o.disabled, onChange: function () { change(o.value); }, className: 'gf-radio__input', 'aria-describedby': o.description ? id + '-desc' : undefined }),
          h('label', { htmlFor: id, className: 'gf-radio__label' }, h('span', { className: 'gf-radio__dot', 'aria-hidden': 'true' }), h('span', null, o.label)),
          o.description ? h('p', { id: id + '-desc', className: 'gf-check__desc' }, o.description) : null);
      })));
  }

  /* Switch ---------------------------------------------------------- */
  function Switch(props) {
    var id = useAutoId(props.id, 'gf-switch');
    var controlled = props.checked !== undefined;
    var st = R.useState(!!props.defaultChecked);
    var on = controlled ? props.checked : st[0];
    function toggle() {
      if (props.disabled) return;
      if (!controlled) st[1](!on);
      if (props.onChange) props.onChange(!on);
    }
    return h('div', { className: cx('gf-switch', props.className) },
      h('button', { type: 'button', id: id, role: 'switch', 'aria-checked': on ? 'true' : 'false', disabled: props.disabled, className: 'gf-switch__track', onClick: toggle },
        h('span', { className: 'gf-switch__thumb', 'aria-hidden': 'true' })),
      props.label ? h('label', { htmlFor: id, className: 'gf-switch__label' }, props.label) : null);
  }

  /* Badge ----------------------------------------------------------- */
  var TONE_ICONS = { info: 'info', success: 'check-circle', warning: 'alert', danger: 'x-circle', ia: 'sparkles' };
  function Badge(props) {
    var tone = props.tone || 'neutral';
    var icon = props.icon === false ? null : (props.icon || TONE_ICONS[tone]);
    var text = props.children != null ? props.children : (tone === 'ia' ? 'IA' : null);
    return h('span', { className: cx('gf-badge', 'gf-badge--' + tone, props.className) },
      icon ? h(Icon, { name: icon, size: 14, strokeWidth: 2.2 }) : null,
      text != null ? h('span', null, text) : null);
  }

  /* Alert ----------------------------------------------------------- */
  function Alert(props) {
    var tone = props.tone || 'info';
    return h('div', { className: cx('gf-alert', 'gf-alert--' + tone, props.className), role: tone === 'danger' ? 'alert' : 'status' },
      h(Icon, { name: TONE_ICONS[tone] || 'info', size: 22, className: 'gf-alert__icon' }),
      h('div', { className: 'gf-alert__body' },
        props.title ? h('p', { className: 'gf-alert__title' }, props.title) : null,
        props.children != null ? h('div', { className: 'gf-alert__text' }, props.children) : null,
        props.action ? h('div', { className: 'gf-alert__action' }, props.action) : null),
      props.onClose ? h('button', { type: 'button', className: 'gf-alert__close', 'aria-label': 'Fechar aviso', onClick: props.onClose }, h(Icon, { name: 'x', size: 18 })) : null);
  }

  /* Card ------------------------------------------------------------ */
  function Card(props) {
    var Tag = props.as || 'section';
    var hasHeader = props.title || props.eyebrow || props.actions;
    return h(Tag, { className: cx('gf-card', 'gf-card--' + (props.variant || 'default'), props.className) },
      hasHeader ? h('header', { className: 'gf-card__header' },
        h('div', { className: 'gf-card__heading' },
          props.eyebrow ? h('p', { className: 'gf-card__eyebrow' }, props.eyebrow) : null,
          props.title ? h('h3', { className: 'gf-card__title' }, props.title) : null),
        props.actions ? h('div', { className: 'gf-card__actions' }, props.actions) : null) : null,
      props.children != null ? h('div', { className: 'gf-card__body' }, props.children) : null,
      props.footer ? h('footer', { className: 'gf-card__footer' }, props.footer) : null);
  }

  /* Tabs ------------------------------------------------------------ */
  function Tabs(props) {
    var items = props.items || [];
    var base = useAutoId(props.id, 'gf-tabs');
    var controlled = props.value !== undefined;
    var st = R.useState(props.defaultValue !== undefined ? props.defaultValue : (items[0] && items[0].id));
    var current = controlled ? props.value : st[0];
    var refs = R.useRef([]);
    function select(id) { if (!controlled) st[1](id); if (props.onChange) props.onChange(id); }
    function onKey(e, i) {
      var n = items.length, j = null;
      if (e.key === 'ArrowRight') j = (i + 1) % n;
      else if (e.key === 'ArrowLeft') j = (i - 1 + n) % n;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = n - 1;
      if (j !== null) { e.preventDefault(); select(items[j].id); if (refs.current[j]) refs.current[j].focus(); }
    }
    var active = items.filter(function (t) { return t.id === current; })[0];
    return h('div', { className: cx('gf-tabs', props.className) },
      h('div', { role: 'tablist', 'aria-label': props.label, className: 'gf-tabs__list' }, items.map(function (t, i) {
        var sel = t.id === current;
        return h('button', {
          key: t.id, ref: function (el) { refs.current[i] = el; }, type: 'button', role: 'tab',
          id: base + '-tab-' + t.id, 'aria-selected': sel ? 'true' : 'false', 'aria-controls': base + '-panel-' + t.id,
          tabIndex: sel ? 0 : -1, className: cx('gf-tabs__tab', sel && 'is-active'),
          onClick: function () { select(t.id); }, onKeyDown: function (e) { onKey(e, i); }
        }, t.label, t.count != null ? h('span', { className: 'gf-tabs__count' }, t.count) : null);
      })),
      active && active.content != null ? h('div', { role: 'tabpanel', id: base + '-panel-' + active.id, 'aria-labelledby': base + '-tab-' + active.id, className: 'gf-tabs__panel', tabIndex: 0 }, active.content) : null);
  }

  /* Table ----------------------------------------------------------- */
  function Table(props) {
    var cols = props.columns || [], rows = props.rows || [];
    return h('div', { className: cx('gf-table-wrap', props.className) },
      h('table', { className: cx('gf-table', props.dense && 'gf-table--dense') },
        props.caption ? h('caption', { className: 'gf-table__caption' }, props.caption) : null,
        h('thead', null, h('tr', null, cols.map(function (c) {
          return h('th', { key: c.key, scope: 'col', style: { width: c.width, textAlign: c.align } }, c.header);
        }))),
        h('tbody', null, rows.length ? rows.map(function (r, i) {
          var key = r.id != null ? r.id : i;
          return h('tr', { key: key, className: props.selectedId != null && r.id === props.selectedId ? 'is-selected' : undefined },
            cols.map(function (c) { return h('td', { key: c.key, style: { textAlign: c.align } }, c.render ? c.render(r) : r[c.key]); }));
        }) : h('tr', null, h('td', { colSpan: cols.length || 1, className: 'gf-table__empty' }, props.emptyText || 'Nenhum registro encontrado.')))));
  }

  /* Stepper --------------------------------------------------------- */
  function Stepper(props) {
    var steps = props.steps || [], cur = props.current || 0;
    return h('ol', { className: cx('gf-stepper', props.orientation === 'vertical' && 'gf-stepper--vertical', props.className), 'aria-label': props.label || 'Etapas' },
      steps.map(function (s, i) {
        var state = i < cur ? 'done' : (i === cur ? 'current' : 'upcoming');
        return h('li', { key: i, className: cx('gf-step', 'is-' + state), 'aria-current': state === 'current' ? 'step' : undefined },
          h('span', { className: 'gf-step__marker', 'aria-hidden': 'true' }, state === 'done' ? h(Icon, { name: 'check', size: 16, strokeWidth: 2.6 }) : String(i + 1)),
          h('span', { className: 'gf-step__text' },
            h('span', { className: 'gf-step__label' }, s.label, s.ai ? h(Badge, { tone: 'ia', className: 'gf-step__ia' }) : null),
            s.description ? h('span', { className: 'gf-step__desc' }, s.description) : null,
            h('span', { className: 'gf-sr' }, state === 'done' ? ' (concluída)' : (state === 'current' ? ' (etapa atual)' : ''))));
      }));
  }

  /* ProgressBar ----------------------------------------------------- */
  function ProgressBar(props) {
    var max = props.max || 100;
    var v = Math.max(0, Math.min(max, props.value || 0));
    var pct = Math.round(v / max * 100);
    var id = useAutoId(props.id, 'gf-progress');
    var showValue = props.showValue !== false;
    return h('div', { className: cx('gf-progress', props.tone && 'gf-progress--' + props.tone, props.className) },
      (props.label || showValue) ? h('div', { className: 'gf-progress__head' },
        props.label ? h('span', { id: id + '-label', className: 'gf-progress__label' }, props.label) : h('span', null),
        showValue ? h('span', { className: 'gf-progress__value' }, props.valueText || (pct + '%')) : null) : null,
      h('div', { className: 'gf-progress__track', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': max, 'aria-valuenow': v, 'aria-valuetext': props.valueText, 'aria-labelledby': props.label ? id + '-label' : undefined },
        h('div', { className: 'gf-progress__fill', style: { width: pct + '%' } })));
  }

  /* Stat ------------------------------------------------------------ */
  function Stat(props) {
    return h('div', { className: cx('gf-stat', props.className) },
      h('p', { className: 'gf-stat__label' }, props.label),
      h('p', { className: 'gf-stat__value' }, props.value, props.unit ? h('span', { className: 'gf-stat__unit' }, props.unit) : null),
      props.delta ? h('p', { className: cx('gf-stat__delta', 'is-' + (props.tone || 'neutral')) }, props.delta) : null,
      props.source ? h('p', { className: 'gf-stat__source' }, props.source) : null);
  }

  /* Modal ----------------------------------------------------------- */
  var FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  function Modal(props) {
    var titleId = useAutoId(null, 'gf-modal');
    var ref = R.useRef(null);
    var onCloseRef = R.useRef(props.onClose);
    onCloseRef.current = props.onClose;
    R.useEffect(function () {
      if (!props.open) return undefined;
      var prev = document.activeElement;
      var el = ref.current;
      if (el) {
        var first = el.querySelector('[data-autofocus]');
        (first || el).focus();
      }
      function onKey(e) {
        if (e.key === 'Escape' && onCloseRef.current) { onCloseRef.current(); return; }
        if (e.key === 'Tab' && el) {
          var nodes = el.querySelectorAll(FOCUSABLE);
          if (!nodes.length) return;
          var a = nodes[0], b = nodes[nodes.length - 1];
          if (e.shiftKey && (document.activeElement === a || document.activeElement === el)) { e.preventDefault(); b.focus(); }
          else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); }
        }
      }
      document.addEventListener('keydown', onKey);
      return function () {
        document.removeEventListener('keydown', onKey);
        if (prev && prev.focus) prev.focus();
      };
    }, [props.open]);
    if (!props.open) return null;
    return h('div', {
      className: 'gf-modal',
      onMouseDown: function (e) { if (e.target === e.currentTarget && props.dismissible !== false && props.onClose) props.onClose(); }
    },
      h('div', { ref: ref, role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId, tabIndex: -1, className: cx('gf-modal__dialog', props.size && 'gf-modal__dialog--' + props.size) },
        h('header', { className: 'gf-modal__header' },
          h('h2', { id: titleId, className: 'gf-modal__title' }, props.title),
          props.onClose ? h('button', { type: 'button', className: 'gf-modal__close', 'aria-label': 'Fechar', onClick: props.onClose }, h(Icon, { name: 'x', size: 20 })) : null),
        h('div', { className: 'gf-modal__body' }, props.children),
        props.footer ? h('footer', { className: 'gf-modal__footer' }, props.footer) : null));
  }

  /* TopBar ---------------------------------------------------------- */
  function TopBar(props) {
    return h('header', { className: cx('gf-topbar', props.className) },
      props.onMenu ? h('button', { type: 'button', className: 'gf-topbar__menu', 'aria-label': 'Abrir menu', onClick: props.onMenu }, h(Icon, { name: 'menu', size: 22 })) : null,
      h('a', { className: 'gf-topbar__brand', href: props.homeHref || '#' },
        props.logoSrc ? h('img', { src: props.logoSrc, alt: props.logoAlt || 'Prefeitura de São Luís', className: 'gf-topbar__logo' }) : null,
        h('span', { className: 'gf-topbar__titles' },
          h('span', { className: 'gf-topbar__title' }, props.title),
          props.subtitle ? h('span', { className: 'gf-topbar__subtitle' }, props.subtitle) : null)),
      props.nav ? h('nav', { className: 'gf-topbar__nav', 'aria-label': 'Principal' }, props.nav.map(function (n, i) {
        return h('a', { key: i, href: n.href || '#', className: cx('gf-topbar__link', n.active && 'is-active'), 'aria-current': n.active ? 'page' : undefined }, n.label);
      })) : null,
      h('div', { className: 'gf-topbar__end' },
        props.actions || null,
        props.user ? h('div', { className: 'gf-topbar__user' },
          h('span', { className: 'gf-topbar__avatar', 'aria-hidden': 'true' }, initials(props.user.name)),
          h('span', { className: 'gf-topbar__user-text' },
            h('span', { className: 'gf-topbar__user-name' }, props.user.name),
            props.user.role ? h('span', { className: 'gf-topbar__user-role' }, props.user.role) : null)) : null));
  }

  /* SideNav --------------------------------------------------------- */
  function SideNav(props) {
    var sections = props.sections || [{ items: props.items || [] }];
    return h('nav', { className: cx('gf-sidenav', props.className), 'aria-label': props.label || 'Menu' },
      sections.map(function (sec, si) {
        return h('div', { key: si, className: 'gf-sidenav__section' },
          sec.title ? h('p', { className: 'gf-sidenav__heading' }, sec.title) : null,
          h('ul', { className: 'gf-sidenav__list' }, (sec.items || []).map(function (it) {
            return h('li', { key: it.id || it.label },
              h('a', {
                href: it.href || '#', className: cx('gf-sidenav__item', it.active && 'is-active'),
                'aria-current': it.active ? 'page' : undefined,
                onClick: props.onSelect ? function (e) { e.preventDefault(); props.onSelect(it); } : undefined
              },
                it.icon ? h(Icon, { name: it.icon, size: 20 }) : null,
                h('span', { className: 'gf-sidenav__label' }, it.label),
                it.badge != null ? h('span', { className: 'gf-sidenav__badge' }, it.badge) : null));
          })));
      }),
      props.footer ? h('div', { className: 'gf-sidenav__footer' }, props.footer) : null);
  }

  /* AISuggestion ---------------------------------------------------- */
  function AISuggestion(props) {
    var status = props.status || 'pending';
    var title = props.title || 'Sugestão da IA';
    return h('section', { className: cx('gf-ai', 'is-' + status, props.className), 'aria-label': title },
      h('header', { className: 'gf-ai__header' },
        h(Badge, { tone: 'ia' }),
        h('p', { className: 'gf-ai__title' }, title),
        status === 'accepted' ? h(Badge, { tone: 'success' }, 'Revisada por ' + (props.reviewer || 'servidor')) : null,
        status === 'discarded' ? h(Badge, { tone: 'neutral', icon: 'x' }, 'Descartada') : null),
      h('div', { className: 'gf-ai__content' }, props.children),
      props.sources && props.sources.length ? h('p', { className: 'gf-ai__sources' }, 'Base usada: ' + props.sources.join(' · ')) : null,
      h('footer', { className: 'gf-ai__footer' },
        h('p', { className: 'gf-ai__note' }, props.note || 'A IA sugere; o servidor revisa, decide e assina.'),
        status === 'pending' ? h('div', { className: 'gf-ai__actions' },
          props.onDiscard ? h(Button, { variant: 'ghost', size: 'sm', icon: 'x', onClick: props.onDiscard }, 'Descartar') : null,
          props.onEdit ? h(Button, { variant: 'secondary', size: 'sm', icon: 'edit', onClick: props.onEdit }, 'Editar') : null,
          props.onAccept ? h(Button, { variant: 'primary', size: 'sm', icon: 'check', onClick: props.onAccept }, 'Usar sugestão') : null) : null));
  }

  var api = {
    Button: Button, Icon: Icon, TextField: TextField, Select: Select, Checkbox: Checkbox,
    RadioGroup: RadioGroup, Switch: Switch, Badge: Badge, Alert: Alert, Card: Card, Tabs: Tabs,
    Table: Table, Stepper: Stepper, ProgressBar: ProgressBar, Stat: Stat, Modal: Modal,
    TopBar: TopBar, SideNav: SideNav, AISuggestion: AISuggestion
  };
  window.GovFuturo = Object.assign(window.GovFuturo || {}, api);
})();
