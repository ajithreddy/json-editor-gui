import sbt._
import Keys._
import play.Project._

object ApplicationBuild extends Build {

  val appName         = "test"
  val appVersion      = "1.0-SNAPSHOT"
 

  val localRepo       = "../../local-repo"


  val appDependencies = Seq(
    // Add your project dependencies here,
    javaCore,
    javaJdbc,
    javaEbean,  
    "com.mongodb" % "mongo" % "2.10.1",
    "com.google.code.morphia" % "morphia" % "0.99",
    "com.google.code.morphia" % "morphia-logging-slf4j" % "0.99"
  )


  val main = play.Project(appName, appVersion, appDependencies).settings(
    // Add your own project settings here      
    resolvers += Resolver.file("vedantu-local-repo", file(localRepo))(Patterns("[module]/[revision]/[artifact]-[revision].[ext]")),
 //   resolvers = Resolver.file("vedantu-local-repo", file(localRepo))(Patterns("[module]/[revision]/[artifact]-[revision].[ext]")) + resolvers, 
    sources in doc in Compile := List()
  )
}
