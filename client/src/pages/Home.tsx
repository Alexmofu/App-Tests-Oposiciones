import { useState } from "react";
import { Link } from "wouter";
import { useTests, useRemoteTests, useFetchRemoteTest } from "@/hooks/use-tests";
import { ImportDialog } from "@/components/ImportDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText, Globe, RefreshCw, BarChart3, ChevronRight, Server } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { data: tests, isLoading: loadingTests } = useTests();
  const [remoteUrl, setRemoteUrl] = useState("");
  const [connectUrl, setConnectUrl] = useState("");
  
  const { data: remoteFiles, isLoading: loadingRemote, refetch: refetchRemote } = useRemoteTests(connectUrl || null);
  const { mutate: fetchRemote, isPending: isDownloading } = useFetchRemoteTest();

  const handleConnect = () => {
    if (!remoteUrl) return;
    let url = remoteUrl;
    if (!url.startsWith("http")) url = `http://${url}`;
    setConnectUrl(url);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between pb-6 border-b border-border">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              OposTest Pro
            </h1>
            <p className="text-muted-foreground font-medium">Professional Examination Platform</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/results">
              <Button variant="outline" className="gap-2 hidden sm:flex">
                <BarChart3 className="w-4 h-4" /> History
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content: Local Tests */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold tracking-tight">Your Library</h2>
              <ImportDialog />
            </div>

            {loadingTests ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-32 bg-muted/50 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : tests?.length === 0 ? (
              <Card className="border-dashed border-2 bg-muted/20">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">No tests imported yet</h3>
                    <p className="text-muted-foreground">Import a JSON file or connect to a remote server to get started.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tests?.map((test, index) => (
                  <motion.div
                    key={test.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/test/${test.id}`} className="group block h-full">
                      <Card className="h-full hover:shadow-xl hover:border-primary/50 transition-all duration-300 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardHeader>
                          <div className="flex justify-between items-start mb-2">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                              <FileText className="w-5 h-5" />
                            </div>
                            <Badge variant="secondary" className="font-mono text-xs">
                              {test.count} Qs
                            </Badge>
                          </div>
                          <CardTitle className="line-clamp-2 text-lg group-hover:text-primary transition-colors">
                            {test.id.replace('.json', '')}
                          </CardTitle>
                          <CardDescription className="line-clamp-1">
                            {test.category || "General Category"}
                          </CardDescription>
                        </CardHeader>
                        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                          <ChevronRight className="w-5 h-5 text-primary" />
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar: Remote Connection */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold tracking-tight">Remote Server</h2>
            <Card className="border-muted bg-card shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="w-5 h-5 text-accent" /> Connect
                </CardTitle>
                <CardDescription>Connect to a local network server</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Server IP / URL</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="192.168.1.50:8000" 
                      value={remoteUrl}
                      onChange={(e) => setRemoteUrl(e.target.value)}
                      className="font-mono text-sm"
                    />
                    <Button size="icon" onClick={handleConnect} disabled={!remoteUrl}>
                      <Server className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {connectUrl && (
                  <div className="pt-4 border-t space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Available Files</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => refetchRemote()}>
                        <RefreshCw className={`w-3 h-3 ${loadingRemote ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>

                    {loadingRemote ? (
                      <div className="space-y-2">
                        <div className="h-8 w-full bg-muted rounded animate-pulse" />
                        <div className="h-8 w-full bg-muted rounded animate-pulse" />
                      </div>
                    ) : remoteFiles?.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">No files found.</p>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                        {remoteFiles?.map((file) => (
                          <div key={file} className="flex items-center justify-between p-2 rounded-lg border bg-muted/30 hover:bg-muted transition-colors text-sm">
                            <span className="truncate flex-1 font-medium">{file}</span>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-primary hover:text-primary hover:bg-primary/10 h-7"
                              disabled={isDownloading}
                              onClick={() => fetchRemote({ url: connectUrl, filename: file })}
                            >
                              Download
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Link href="/admin">
              <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground">
                Go to Admin Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
