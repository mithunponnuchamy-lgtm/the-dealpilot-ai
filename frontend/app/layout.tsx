import './globals.css';
import { DealPilotProvider } from './context/DealPilotContext';

export const metadata = {
  title: 'DealPilot AI',
  description: 'From conversation to agreement to payment.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DealPilotProvider>{children}</DealPilotProvider>
      </body>
    </html>
  );
}
