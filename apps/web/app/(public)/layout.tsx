import KoffiWidget from '@/components/koffi/KoffiWidget';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <KoffiWidget />
    </>
  );
}