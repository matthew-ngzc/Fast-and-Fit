import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClockIcon, FlameIcon } from "lucide-react"
import Link from "next/link"

interface WorkoutCardProps {
  title: string
  duration: string
  level: string
  calories: string
  image: string
  href?: string
}

export function WorkoutCard({ title, duration, level, calories, image, href }: WorkoutCardProps) {
  const content = (
    <Card className="overflow-hidden">
      <div className="relative h-48">
        <Image src={image || "/placeholder.svg"} alt={title} fill className="object-cover" />
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">{title}</h3>
          <div className="flex items-center text-xs text-muted-foreground">
            <ClockIcon className="h-3 w-3 mr-1" />
            {duration}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-xs text-muted-foreground">{level}</div>
          <div className="flex items-center text-xs text-muted-foreground">
            <FlameIcon className="h-3 w-3 mr-1" />
            {calories} cal
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button variant="outline" size="sm" className="w-full">
          Start Workout
        </Button>
      </CardFooter>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    )
  }

  return content
}

