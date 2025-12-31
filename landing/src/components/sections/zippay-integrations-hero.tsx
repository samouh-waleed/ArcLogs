'use client';

type ZippayIntegrationsHeroProps = {
  tagline?: string;
  title?: string;
  description?: string;
  className?: string;
};

export default function ZippayIntegrationsHero({
  tagline = 'Integrations',
  title = 'Integration Tools You Need to Grow Business',
  description = 'Seamlessly connect with essential systems and applications to streamline operations and support your business growth',
  className,
}: ZippayIntegrationsHeroProps) {
  return (
    <section
      className={`bg-primary-300 px-6 py-16 text-white lg:py-28 ${className ?? ''}`}
    >
      <div className="container">
        <div className="mx-auto max-w-5xl text-center">
          <span className="text-body-xs-medium bg-gray-0/10 inline-flex h-7 items-center rounded-[10px] border border-white/15 px-3 text-white/90 shadow-[0_1px_2px_0_rgba(13,13,18,0.06)] backdrop-blur-[2px]">
            {tagline}
          </span>

          <h1 className="text-heading-1 mx-auto mt-5 max-w-[876px] tracking-tight sm:text-6xl lg:text-[64px]">
            {title}
          </h1>

          <p className="text-body-md sm:text-body-lg mx-auto mt-5 max-w-[648px] text-white/80">
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}
