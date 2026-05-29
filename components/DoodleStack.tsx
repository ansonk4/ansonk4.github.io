import Image from "next/image";

export function DoodleStack() {
  return (
    <aside className="doodle-stack" aria-hidden="true">
      <Image
        src="/assets/left-doodles.png"
        alt=""
        width={132}
        height={360}
        sizes="132px"
        className="left-doodles-image"
      />
    </aside>
  );
}
