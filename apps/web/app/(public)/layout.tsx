import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import KoffiWidget from '@/components/koffi/KoffiWidget';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        {children}
      </main>
      <Footer />
      <KoffiWidget />
    </>
  );
}