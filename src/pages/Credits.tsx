import { imageUrl } from '../components/media'
import { imageCredits, videoCredits, type ImageName } from '../data/media.generated'

export default function Credits() {
  const photos = Object.entries(imageCredits) as [ImageName, (typeof imageCredits)[ImageName]][]
  return (
    <div className="gutter pb-24 pt-[7.5rem]">
      <p className="eyebrow mb-4 text-majolica">Credits</p>
      <h1 className="display text-[clamp(2.8rem,6vw,5rem)]">
        The people <em>behind the pictures.</em>
      </h1>
      <p className="mt-5 max-w-2xl text-[1.05rem] text-muted">
        Photographs are from Wikimedia Commons and are used under the Creative Commons licences listed beside each one;
        they have been resized and cropped. Films are from Mixkit under the Mixkit Stock Video Free License, trimmed and
        re-encoded without sound. Earth textures are NASA Blue Marble and Black Marble imagery.
      </p>

      <h2 className="display mt-14 text-[2.2rem]">Photographs ({photos.length})</h2>
      <ul className="mt-6 grid gap-x-8 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
        {photos.map(([name, c]) => (
          <li key={name} className="flex gap-4 border-t border-ink/10 pt-4">
            <img src={imageUrl(name, 800)} alt="" loading="lazy" className="h-16 w-24 shrink-0 rounded-sm bg-paper-2 object-cover" />
            <p className="min-w-0 text-sm">
              <a href={c.source} target="_blank" rel="noreferrer" className="link-line font-medium">
                {c.title}
              </a>
              <span className="block text-muted">
                by {c.creator} ·{' '}
                {c.licenseUrl ? (
                  <a href={c.licenseUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                    {c.license}
                  </a>
                ) : (
                  c.license
                )}
              </span>
            </p>
          </li>
        ))}
      </ul>

      <h2 className="display mt-16 text-[2.2rem]">Films</h2>
      <ul className="mt-6 grid gap-x-8 gap-y-3 md:grid-cols-2 xl:grid-cols-3">
        {Object.values(videoCredits).map((v) => (
          <li key={v.mixkitId} className="border-t border-ink/10 pt-3 text-sm">
            <a href={`https://mixkit.co/free-stock-video/${v.mixkitId}/`} target="_blank" rel="noreferrer" className="link-line font-medium">
              {v.title}
            </a>
            <span className="block text-muted">Mixkit clip {v.mixkitId}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
