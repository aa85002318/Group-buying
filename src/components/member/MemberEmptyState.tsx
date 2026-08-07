export function MemberEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#E8E1D7] bg-white px-4 py-8 text-center text-sm text-[#687386]">
      {message}
    </div>
  );
}
