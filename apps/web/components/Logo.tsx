import Image from 'next/image';
import Link  from 'next/link';

interface LogoProps {
  width?:  number;
  height?: number;
  href?:   string;
}

export default function Logo({ width = 140, height = 50, href = '/' }: LogoProps) {
  return (
    <Link href={href}>
      <Image
        src="/Shop.png"
        alt="ShopEasy CI"
        width={width}
        height={height}
        className="object-contain"
        priority
      />
    </Link>
  );
}