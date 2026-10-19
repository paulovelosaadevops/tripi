import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

/** Ícones de traço do protótipo (24×24). */
const shapes = {
  back: <Path d="M15 5l-7 7 7 7" />,
  close: <Path d="M6 6l12 12M18 6L6 18" />,
  plus: <Path d="M12 5v14M5 12h14" />,
  minus: <Path d="M5 12h14" />,
  bell: <Path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0" />,
  bolt: <Path d="M13 3L5 14h6l-1 7 8-11h-6z" />,
  swap: <Path d="M7 4L3 8l4 4M3 8h14M17 12l4 4-4 4M21 16H7" />,
  chevronRight: <Path d="M9 5l7 7-7 7" />,
  copy: (
    <>
      <Rect x={9} y={9} width={11} height={11} rx={2} />
      <Path d="M5 15V5a2 2 0 0 1 2-2h8" />
    </>
  ),
  navigate: <Path d="M3 11l18-8-8 18-2-8z" />,
  wallet2: (
    <>
      <Rect x={3} y={6} width={18} height={14} rx={3} />
      <Path d="M3 10h18M7 3h10" />
    </>
  ),
  alert: (
    <>
      <Path d="M12 3l10 18H2z" />
      <Path d="M12 10v5M12 18v.01" />
    </>
  ),
  search: (
    <>
      <Circle cx={11} cy={11} r={7} />
      <Path d="M20 20l-3.5-3.5" />
    </>
  ),
  compass: (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </>
  ),
  calendar: (
    <>
      <Rect x={3.5} y={5} width={17} height={15} rx={2} />
      <Path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  ticket: (
    <>
      <Path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z" />
      <Path d="M14 7v10" />
    </>
  ),
  wallet: (
    <>
      <Rect x={3} y={6} width={18} height={13} rx={2} />
      <Path d="M3 10h18M16 14.5h2" />
    </>
  ),
  dots: (
    <>
      <Circle cx={5} cy={12} r={1.2} />
      <Circle cx={12} cy={12} r={1.2} />
      <Circle cx={19} cy={12} r={1.2} />
    </>
  ),
  map: <Path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14" />,
  share: (
    <>
      <Circle cx={18} cy={5} r={2.5} />
      <Circle cx={6} cy={12} r={2.5} />
      <Circle cx={18} cy={19} r={2.5} />
      <Path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" />
    </>
  ),
  edit: <Path d="M4 20h4L19 9l-4-4L4 16z" />,
  check: <Path d="M5 12l5 5 9-10" />,
  checklist: (
    <>
      <Path d="M9 11l3 3 8-8" />
      <Path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9" />
    </>
  ),
  document: <Path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5" />,
  plane: <Path d="M2 16l20-6-2-3-6 2-5-5-2 1 3 5-5 2-2-2-2 1zM3 21h18" />,
  mail: (
    <>
      <Rect x={3} y={5} width={18} height={14} rx={2} />
      <Path d="M3 7l9 6 9-6" />
    </>
  ),
  cloud: <Path d="M7 18a4.5 4.5 0 0 1-.5-9A6 6 0 0 1 18 8a4 4 0 0 1 0 10zM9.5 13l2 2 3.5-3.5" />,
  gear: (
    <>
      <Circle cx={12} cy={12} r={3} />
      <Path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
    </>
  ),
  users: (
    <>
      <Circle cx={9} cy={8} r={3.5} />
      <Path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <Circle cx={17} cy={9} r={2.5} />
      <Path d="M17 14a5 5 0 0 1 4.5 5" />
    </>
  ),
  phone: <Path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />,
  note: <Path d="M4 6h16M4 12h16M4 18h10" />,
  upload: <Path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />,
  contrast: (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" />
    </>
  ),
  user: (
    <>
      <Circle cx={12} cy={8} r={4} />
      <Path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  trash: <Path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
  logout: <Path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11" />,
  mountain: (
    <>
      <Path d="M3 20l6-10 4 6 3-4 5 8z" />
      <Circle cx={17} cy={6} r={2} />
    </>
  ),
  sun: (
    <>
      <Circle cx={12} cy={12} r={4} />
      <Path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  camera: (
    <>
      <Path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <Circle cx={12} cy={13} r={3.5} />
    </>
  ),
  wifiOff: <Path d="M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0M3 3l18 18" />,
} as const;

export type IconName = keyof typeof shapes;

type IconProps = {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
};

export function Icon({ name, size = 22, color, strokeWidth = 1.9 }: IconProps) {
  // Ícones são decorativos: o texto ou o accessibilityLabel do botão já descreve a ação.
  return (
    <View pointerEvents="none" aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        color={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round">
        {shapes[name]}
      </Svg>
    </View>
  );
}

/** Marca do Tripi: rota pontilhada até um pino. */
export function TripiMark({ size = 56, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10 36c4-7 9-3 14-7s7-4 11-2" strokeDasharray="1 6" />
      <Circle cx={10} cy={36} r={3.5} fill={color} />
      <Path d="M38 6c-4.4 0-8 3.4-8 7.6C30 19 38 26 38 26s8-7 8-12.4C46 9.4 42.4 6 38 6z" />
      <Circle cx={38} cy={13.5} r={2.5} fill={color} />
    </Svg>
  );
}
