import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <span className="text-4xl font-bold">F</span>
          </div>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          Welcome to <span className="gradient-text">FUN</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
          The ultimate creator platform for adult content. Connect with fans, monetize your content, and build your empire.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            size="lg"
            className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-secondary"
            onClick={() => window.location.href = "/api/login"}
            data-testid="button-get-started"
          >
            Get Started
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-lg px-8 py-6"
            data-testid="button-learn-more"
          >
            Learn More
          </Button>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-card rounded-xl border border-border">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Monetize Your Content</h3>
            <p className="text-sm text-muted-foreground">
              Premium subscriptions, tips, and exclusive content. You keep more of what you earn.
            </p>
          </div>

          <div className="p-6 bg-card rounded-xl border border-border">
            <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Go Live</h3>
            <p className="text-sm text-muted-foreground">
              Stream to thousands. Real-time chat, tips, and engagement with your biggest fans.
            </p>
          </div>

          <div className="p-6 bg-card rounded-xl border border-border">
            <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Build Community</h3>
            <p className="text-sm text-muted-foreground">
              Connect with fans through forums, messages, and exclusive communities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
