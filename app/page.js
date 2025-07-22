import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { features, steps } from "@/lib/landing";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col mt-12">
      <section className="mt-20 pb-12 space-y-10 md:space-y-15 px-5">
        <div className="container mx-auto px-4 md:px-6 text-center space-y-6">
          <Badge
            variant="outline"
            className="bg-green-100 text-green-600 cursor-pointer"
          >
            Split Expenses. No awkward math.
          </Badge>
          <h1 className="gradient-heading mx-auto max-w-4xl text-4xl md:text-7xl">
            The smartest way to split expenses with friends
          </h1>
          <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed">
            Splitease is a free, open-source tool that makes it easy to split
            expenses with friends, family, or roommates. Whether you're sharing
            bills, splitting a dinner bill, or managing group trips, Splitease
            simplifies the process and ensures everyone pays their fair share
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row justify-center">
            <Button className="bg-green-500 hover:bg-green-600 duration-300">
              <Link href="/dashboard">
                Get Started
                <ArrowRight className="inline-block ml-2" />
              </Link>
            </Button>
            <Button variant="outline" className="text-green-500 border-green-500 hover:bg-green-50 duration-300">
              <Link href="#how-it-works">
                See How It Works
              </Link>
            </Button>
          </div>
        </div>
        <div className="container mx-auto max-w-5xl overflow-hidden rounded-xl shadow-xl">
          <div className="gradient p-1 aspect-[16/9]">
            <Image
              src="/hero.png"
              alt="banner"
              width={1280}
              height={720}
              className="mx-auto rounded-lg"
              priority
            />
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section id="features" className="bg-gray-50 py-20">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <Badge variant="outline" className="bg-green-100 text-green-600 cursor-pointer">
            Features
          </Badge>
          <h2 className="gradient-heading mt-2 text-3xl md:text-4xl">
            Everything you need to manage your expenses
          </h2>
          <p className="mx-auto mt-3 max-w-[700px] text-gray-500 md:text-xl/relaxed">
            Our platform provides all the tools you need to handle shared
            expenses with ease
          </p>
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ title, Icon, bg, color, description }) => (
              <Card key={title} className="flex flex-col items-center space-y-4 p-6 text-center">
                <div className={`rounded-full p-3 ${bg}`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="text-sm text-gray-500">{description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <Badge variant="outline" className="bg-green-100 text-green-600 cursor-pointer">
            How It Works
          </Badge>
          <h2 className="gradient-heading mt-2 text-3xl md:text-4xl">
            Splitting expenses has never been easier
          </h2>
          <p className="mx-auto mt-3 max-w-[700px] text-gray-500 md:text-xl/relaxed">
            Follow these simple steps to get started with splitease
          </p>
          <div className="mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-3">
            {steps.map(({ label, title, description }) => (
              <Card key={label} className="flex flex-col items-center space-y-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-xl font-bold text-green-500"
                >
                  {label}
                </div>
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="text-sm text-center text-gray-500">{description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
      {/* Get Started */}
      <section className="py-20 gradient">
        <div className="container mx-auto px-4 md:px-6 text-center space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl text-white">
            Ready to simplify your expense management?
          </h2>
          <p className="mx-auto max-w-[600px] text-green-100 md:text-xl/relaxed">
            join users around the world who are already enjoying the benefits of splitease
          </p>
          <Button asChild size="lg" className="bg-green-800 hover:opacity-90">
            <Link href="/dashboard">
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>
      {/* Footer */}
      <footer className="border-t bg-gray-50 py-12 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} splitease. All rights reserved.
      </footer>
    </div>
  );
}