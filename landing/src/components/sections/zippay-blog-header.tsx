import Image from 'next/image';

export default function ZippayBlogHero() {
  return (
    <section className="bg-gray-25 px-6 pt-10 pb-0 lg:pt-16 lg:pb-0 dark:bg-gray-200">
      <div className="container">
        <span className="text-body-xs-medium bg-gray-0 inline-flex h-8 items-center gap-2 rounded-[10px] border border-gray-100 px-3 py-0 leading-none shadow-[0_1px_2px_0_rgba(13,13,18,0.06)]">
          <Image
            src="/images/homepage/features/elipse.svg"
            alt=""
            width={6}
            height={6}
            className="h-[6px] w-[6px]"
          />
          Zippay Blog
        </span>
        <h1 className="text-foreground text-heading-1 mt-4 max-w-[680px] tracking-tight lg:text-[68px] lg:leading-[125%]">
          Knowledge Transfer
        </h1>
        <p className="text-body-md sm:text-body-lg mt-4 text-gray-400">
          Thoughts on the future of work, from the people and teams creating it
        </p>
      </div>
    </section>
  );
}
