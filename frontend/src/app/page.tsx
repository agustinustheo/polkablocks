import Image from "next/image";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8  sm:p-20">
      <h1>POLKADOT</h1>

      <Image
        src="/logo.svg"
        alt="Rotating Logo"
        className="w-20 h-20 animate-spin"
        width={200}
        height={200}
      />
    </div>
  );
}
