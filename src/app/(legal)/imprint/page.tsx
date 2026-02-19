export const metadata = {
  title: "Imprint - Phantom",
};

export default function ImprintPage() {
  return (
    <article className="prose-legal">
      <h1 className="text-[28px] font-bold text-white mb-2">Imprint</h1>
      <p className="text-[13px] text-[#52525B] mb-10">Impressum gem&auml;&szlig; &sect; 5 TMG</p>

      <Section title="Angaben gem&auml;&szlig; &sect; 5 TMG">
        <p>
          Phantom<br />
          [Name / Firma]<br />
          [Stra&szlig;e Nr.]<br />
          [PLZ Ort]<br />
          Deutschland
        </p>
      </Section>

      <Section title="Kontakt">
        <p>
          E-Mail:{" "}
          <a href="mailto:hello@phantom.app" className="text-white hover:underline">hello@phantom.app</a>
        </p>
      </Section>

      <Section title="Verantwortlich f&uuml;r den Inhalt nach &sect; 55 Abs. 2 RSt">
        <p>
          [Vor- und Nachname]<br />
          [Stra&szlig;e Nr.]<br />
          [PLZ Ort]
        </p>
      </Section>

      <Section title="EU-Streitschlichtung">
        <p>
          Die Europ&auml;ische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
          <a
            href="https://ec.europa.eu/consumers/odr/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:underline break-all"
          >
            https://ec.europa.eu/consumers/odr/
          </a>
        </p>
        <p>
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </Section>

      <Section title="Haftung f&uuml;r Inhalte">
        <p>
          Als Diensteanbieter sind wir gem&auml;&szlig; &sect; 7 Abs. 1 TMG f&uuml;r eigene Inhalte auf diesen
          Seiten nach den allgemeinen Gesetzen verantwortlich. Nach &sect;&sect; 8 bis 10 TMG sind
          wir als Diensteanbieter jedoch nicht verpflichtet, &uuml;bermittelte oder gespeicherte
          fremde Informationen zu &uuml;berwachen oder nach Umst&auml;nden zu forschen, die auf eine
          rechtswidrige T&auml;tigkeit hinweisen.
        </p>
      </Section>

      <Section title="Haftung f&uuml;r Links">
        <p>
          Unser Angebot enth&auml;lt Links zu externen Websites Dritter, auf deren Inhalte wir keinen
          Einfluss haben. Deshalb k&ouml;nnen wir f&uuml;r diese fremden Inhalte auch keine Gew&auml;hr
          &uuml;bernehmen. F&uuml;r die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter
          oder Betreiber der Seiten verantwortlich.
        </p>
      </Section>

      <Section title="Urheberrecht">
        <p>
          Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
          unterliegen dem deutschen Urheberrecht. Die Vervielf&auml;ltigung, Bearbeitung, Verbreitung
          und jede Art der Verwertung au&szlig;erhalb der Grenzen des Urheberrechtes bed&uuml;rfen der
          schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
        </p>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h3 className="text-[16px] font-semibold text-white mb-3">{title}</h3>
      <div className="text-[14px] text-[#A1A1AA] leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:text-[#71717A]">
        {children}
      </div>
    </section>
  );
}
