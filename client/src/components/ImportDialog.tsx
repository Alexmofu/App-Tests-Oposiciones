import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UploadCloud, FileJson } from "lucide-react";
import { useImportTest } from "@/hooks/use-tests";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ImportDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { mutate, isPending } = useImportTest();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = JSON.parse(e.target?.result as string);
        if (!Array.isArray(content)) throw new Error("JSON must be an array");
        
        mutate({ filename: file.name, content }, {
          onSuccess: () => {
            setOpen(false);
            setFile(null);
          }
        });
      } catch (err) {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2 bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/20">
          <UploadCloud className="w-4 h-4" /> Import Local JSON
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Test Questions</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="file">Select .json file</Label>
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
              <Input 
                id="file" 
                type="file" 
                accept=".json" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileChange}
              />
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <FileJson className="w-8 h-8" />
                <span>{file ? file.name : "Drag & drop or click to select"}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleImport} disabled={!file || isPending}>
            {isPending ? "Importing..." : "Import File"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
