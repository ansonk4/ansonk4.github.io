import Image from "next/image";

type SectionTitleProps = {
  icon: string;
  children: React.ReactNode;
};

export function SectionTitle({ icon, children }: SectionTitleProps) {
  return (
    <div className="section-title">
      <span className="section-icon" aria-hidden="true">
        <Image src={icon} alt="" width={54} height={54} />
      </span>
      <h2>{children}</h2>
    </div>
  );
}
