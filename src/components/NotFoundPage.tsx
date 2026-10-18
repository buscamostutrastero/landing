import { ArrowRight, ArrowUpRight, CornerDownLeft, Home, Mail, Package } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { business } from '../lib/business';

export default function NotFoundPage() {
  return (
    <div className="not-found-shell">
      <a className="skip-link" href="#contenido">Ir al contenido</a>

      <header className="not-found-header not-found-container">
        <a className="not-found-brand" href="/" aria-label={`${business.name}, inicio`}>
          <img src="/brand/logo.webp" width="1260" height="380" alt={business.name} />
        </a>
        <span className="not-found-opening"><span aria-hidden="true" />Próxima apertura</span>
      </header>

      <main className="not-found-main not-found-container" id="contenido" tabIndex={-1}>
        <div className="not-found-grid">
          <section className="not-found-copy" aria-labelledby="not-found-heading">
            <span className="not-found-status">Error 404</span>
            <h1 id="not-found-heading">Esta página <span>no existe.</span></h1>
            <p className="not-found-description">El enlace puede haber cambiado o la dirección no ser correcta. Vamos a volver a lo que buscabas.</p>

            <div className="not-found-actions">
              <Button asChild size="lg" className="not-found-action not-found-primary">
                <a href="/"><Home aria-hidden="true" />Volver al inicio<ArrowRight aria-hidden="true" /></a>
              </Button>
              <Button asChild variant="outline" size="lg" className="not-found-action not-found-secondary">
                <a href="/contacto/">Consultar un trastero<ArrowUpRight aria-hidden="true" /></a>
              </Button>
            </div>

            <nav className="not-found-shortcuts" aria-label="Accesos útiles">
              <p>También puedes ir directamente a:</p>
              <ul>
                <li><a href="/#trasteros">Tamaños<ArrowUpRight aria-hidden="true" /></a></li>
                <li><a href="/#ubicacion">Ubicación<ArrowUpRight aria-hidden="true" /></a></li>
                <li><a href="/#preguntas">Preguntas<ArrowUpRight aria-hidden="true" /></a></li>
              </ul>
            </nav>
          </section>

          <Card className="not-found-visual" aria-hidden="true">
            <div className="not-found-visual-grid" />
            <span className="not-found-visual-label">Un enlace fuera de sitio</span>
            <div className="not-found-code">
              <span>4</span>
              <div className="not-found-unit">
                <div className="not-found-shutter"><span /></div>
                <div className="not-found-box"><Package /></div>
              </div>
              <span>4</span>
            </div>
            <div className="not-found-visual-note"><CornerDownLeft /><span>Por aquí se vuelve al inicio.</span></div>
          </Card>
        </div>

        <div className="not-found-help">
          <Separator />
          <div className="not-found-help-content">
            <div><strong>¿Necesitas ayuda?</strong><p>Escríbenos y te orientamos.</p></div>
            <a className="not-found-email" href={`mailto:${business.email}`}><Mail aria-hidden="true" /><span>{business.email}</span></a>
          </div>
        </div>
      </main>

      <footer className="not-found-footer not-found-container">
        <span>© {new Date().getFullYear()} {business.name}</span>
        <a href="/politica-privacidad/">Privacidad</a>
        <button type="button" data-cookie-settings>Configurar cookies</button>
      </footer>
    </div>
  );
}
