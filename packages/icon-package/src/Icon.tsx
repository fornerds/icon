import React from 'react';

export interface IconProps {
  size?: number | string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export interface IconComponentProps extends IconProps {
  svg: string;
}

export const Icon: React.FC<IconComponentProps> = ({
  svg,
  size = 24,
  color,
  className,
  style,
}) => {
  const sizeValue = typeof size === 'number' ? `${size}px` : size;

  const svgWithProps = svg
    .replace(/<svg/, `<svg width="${sizeValue}" height="${sizeValue}"`)
    .replace(/fill="[^"]*"/g, color ? `fill="${color}"` : '')
    .replace(/stroke="[^"]*"/g, color ? `stroke="${color}"` : '');

  return (
    <span
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: svgWithProps }}
    />
  );
};


