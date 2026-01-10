import clsx from 'clsx';
import { NAV_LABEL_TEXT_STYLE } from '../../utils/styles';

interface NavLabelProps {
  text: string;
  font: string;
  className?: string;
}

const NavLabel = ({ text, font, className }: NavLabelProps) => {
  return (
    <span
      className={clsx('text-4xl md:text-6xl', 'text-white/95', className)}
      style={{
        fontFamily: font,
        ...NAV_LABEL_TEXT_STYLE,
      }}
    >
      {text}
    </span>
  );
};

export default NavLabel;
