type SectionTitleProps = {
  children: React.ReactNode;
};

export function SectionTitle({ children }: SectionTitleProps) {
  return (
    <div className="section-title">
      <h2>{children}</h2>
    </div>
  );
}
