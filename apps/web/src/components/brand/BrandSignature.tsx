type BrandSignatureProps = {
  size?: "sm" | "md" | "lg";
};

export function BrandSignature({ size = "md" }: BrandSignatureProps) {
  return (
    <div className={`brandFull brandFull-${size}`}>
      <img
        src="/brand/logo-nucleo-horizontal.png"
        alt="NÚCLEO | Central da Família"
        className="brandFullImage"
      />
    </div>
  );
}
