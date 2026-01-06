'use client';

import ZippayCtaCard from '@/components/sections/zippay-cta-card';

import CookiePolicy from './cookie-policy.mdx';

const Page = () => {
  return (
    <>
      <section className="bg-primary-300 px-6 py-16 text-white lg:py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-5xl leading-[1.08] font-bold tracking-tight sm:text-6xl">
              Cookie Policy
            </h1>
            <p className="text-body-lg mx-auto mt-4 max-w-2xl text-white/80">
              Understand how we collect, use, and protect your personal
              information to ensure your privacy and security
            </p>
          </div>
        </div>
      </section>

      <section className="bg-gray-0 px-6 pb-16 lg:pb-24">
        <div className="bg-gray-0 container -mt-6 rounded-t-[24px] px-4 py-10 md:-mt-8 md:px-10 md:py-14">
          <article className="prose prose-lg dark:prose-invert prose-headings:!text-foreground prose-p:!text-foreground max-w-none">
            <CookiePolicy />
          </article>
        </div>
      </section>
      <ZippayCtaCard />
    </>
  );
};

export default Page;
