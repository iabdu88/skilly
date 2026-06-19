export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <h1 className="text-2xl font-bold">Access Denied</h1>
      <p className="text-muted-foreground mt-2">You do not have permission to view this page.</p>
      <a href="/login" className="mt-6 text-primary underline text-sm">Back to login</a>
    </div>
  );
}
