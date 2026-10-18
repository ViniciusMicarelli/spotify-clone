export default function TrackTechnical({ technical }) {
  return <section className="track-technical" aria-label="Informações do áudio"><h2>Informações do áudio</h2>
    {!technical ? <p className="muted">Dados técnicos não disponíveis para este áudio.</p> : <>
      <dl><div><dt>Formato</dt><dd>{technical.container} · {technical.codec}</dd></div>
        <div><dt>Bitrate</dt><dd>{(technical.bitrate / 1000).toLocaleString('pt-BR')} kbps</dd></div>
        <div><dt>Taxa de amostragem</dt><dd>{technical.sampleRate.toLocaleString('pt-BR')} Hz</dd></div>
        <div><dt>Canais</dt><dd>{technical.channels === 1 ? '1 (mono)' : technical.channels === 2 ? '2 (estéreo)' : technical.channels}</dd></div>
        <div><dt>Profundidade</dt><dd>{technical.bitsPerSample} bits</dd></div>
        <div><dt>Duração do arquivo</dt><dd>{(technical.durationMs / 1000).toLocaleString('pt-BR')} s</dd></div>
      </dl><p className="muted">Dados lidos do arquivo local de demonstração. A duração cadastrada da faixa é independente.</p>
    </>}
  </section>;
}
