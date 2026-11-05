import Link from "next/link";
export default function NotFound() {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-xl place-items-center px-4 text-center">
      <div>
        <p className="font-display text-[8rem] font-black leading-none text-gradient">404</p>
        <h1 className="mt-2 font-display text-2xl font-bold">Page not found</h1>
        <Link href="/" className="btn btn-primary mt-8">Home</Link>
      </div>
    </div>
  );
}
