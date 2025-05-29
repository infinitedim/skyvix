import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@skyvix/ui";

export default function Home() {
  return (
    <main className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Welcome to Skyvix</h1>
        <p className="text-xl text-muted-foreground">
          Modern web application built with NextJS, NestJS, and PostgreSQL
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Frontend</CardTitle>
            <CardDescription>NextJS with shadcn/ui</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Modern React framework with beautiful UI components
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backend</CardTitle>
            <CardDescription>NestJS API</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Scalable Node.js framework for building efficient server-side applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database</CardTitle>
            <CardDescription>PostgreSQL</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Powerful, open source object-relational database system
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="text-center mt-12">
        <Button>Get Started</Button>
      </div>
    </main>
  );
}