import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ postId: string }>;
}

export default async function PostRedirectPage({ params }: Props) {
  const { postId } = await params;
  redirect(`/?post=${postId}`);
}
