export default function ZippayMission() {
  return (
    <section className="bg-gray-0 px-6 py-10 lg:py-24 dark:bg-gray-200">
      <div className="container">
        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-16">
          <div>
            <span className="text-body-xs-medium text-primary-200">
              Mission
            </span>

            <h1 className="text-heading-1 mt-4 max-w-[680px] tracking-tight text-gray-900 lg:text-[68px] lg:leading-[125%]">
              Our Mission
            </h1>
          </div>

          <div className="max-w-xl lg:pt-10">
            <p className="text-body-md sm:text-body-lg text-gray-500">
              While we absolutely love productivity software, we believe
              productivity, in general, is broken. There's just too many tools
              to keep track of, too many things in entirely separate ecosystems.
              There has to be a better way to work - that's why we created
              Zippay, first an internal tool, now as a way to fulfill our vision
              of making the world more productive.
            </p>
            <p className="text-body-md sm:text-body-lg mt-4 text-gray-500">
              Eventually, our goal is to have all work live in Zippay - thereby
              making people more productive and giving back at least 20% of time
              to dedicate to other things. One app to replace them all. We're
              just getting started, and are so grateful for all of the 2 million
              teams that are in this together with our team.{' '}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
