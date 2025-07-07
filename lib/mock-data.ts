// This file is for testing purposes only
// In a real app, this data would come from a database

export function seedMockData() {
  if (typeof window === "undefined") return

  // Only seed if data doesn't exist
  if (!localStorage.getItem("tasks")) {
    const tasks = [
      {
        id: "task1",
        title: "Design Website Homepage",
        description: "Create a modern homepage design for KushL",
        status: "completed",
        assigneeId: "student1",
        assignedTo: "student1",
        ownerId: "employer1",
        category: "Website Development",
        price: 500,
        completedAt: Date.now() - 1000000,
      },
      {
        id: "task2",
        title: "Develop Login System",
        description: "Implement secure login system with OAuth",
        status: "completed",
        assigneeId: "student1",
        assignedTo: "student1",
        ownerId: "employer2",
        category: "Software Development",
        price: 800,
        completedAt: Date.now() - 500000,
      },
      {
        id: "task3",
        title: "Create Marketing Video",
        description: "Create a 2-minute promotional video",
        status: "completed",
        assigneeId: "student1",
        assignedTo: "student1",
        ownerId: "employer1",
        category: "Video Editing",
        price: 600,
        completedAt: Date.now() - 200000,
      },
    ]

    localStorage.setItem("tasks", JSON.stringify(tasks))
  }

  // Seed users if they don't exist
  if (!localStorage.getItem("users")) {
    const users = [
      {
        id: "student1",
        email: "student@gmail.com",
        fullName: "Student User",
        role: "student",
      },
      {
        id: "employer1",
        email: "employer1@example.com",
        fullName: "Tech Solutions Inc.",
        role: "employer",
        profile: {
          companyLogo: "/abstract-geometric-ts.png",
        },
      },
      {
        id: "employer2",
        email: "employer2@example.com",
        fullName: "Creative Agency",
        role: "employer",
        profile: {
          companyLogo: "/california-golden-poppies.png",
        },
      },
    ]

    localStorage.setItem("users", JSON.stringify(users))
  }

  // Seed projects if they don't exist
  if (!localStorage.getItem("kushl_projects")) {
    const projects = [
      {
        id: "project1",
        name: "Website Redesign",
        ownerId: "employer1",
        category: "Website Development",
        sprints: [
          {
            id: "sprint1",
            name: "Phase 1",
            campaigns: [
              {
                id: "campaign1",
                name: "Frontend Development",
                tasks: [
                  {
                    id: "projectTask1",
                    title: "Implement Responsive Design",
                    description: "Make the website responsive for all devices",
                    status: "completed",
                    assigneeId: "student1",
                    assignedTo: "student1",
                    category: "Website Development",
                    price: 400,
                    completedAt: Date.now() - 300000,
                  },
                ],
              },
            ],
          },
        ],
      },
    ]

    localStorage.setItem("kushl_projects", JSON.stringify(projects))
  }
}

// Call this function when the app loads
if (typeof window !== "undefined") {
  seedMockData()
}
