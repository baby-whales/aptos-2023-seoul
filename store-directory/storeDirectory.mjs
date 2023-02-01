import { NFTStorage } from 'nft.storage'
import { filesFromPath } from 'files-from-path'
import path from 'path'

//const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDA2MzdGNEYyNjhmQzk1NzA2MDM4OTMwYTliRDQwMjg1NGIwZDNDYTUiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY3NDMxMTIxNjc2OSwibmFtZSI6IkNhbm5lZEJpIn0.8_JVMg2a7yOX6ks8wgjVS83Jdq5gixdtYa_AsmGNipE'
//const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDA2MzdGNEYyNjhmQzk1NzA2MDM4OTMwYTliRDQwMjg1NGIwZDNDYTUiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY3NDMxMTgwODIxOSwibmFtZSI6IkNhbm5lZEJpRGVjYXAifQ.mkIOLz71Dy35TV8klZi0N8k7OmgFUsMwu_xI0WQ94XY'
// new badges
//const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDA2MzdGNEYyNjhmQzk1NzA2MDM4OTMwYTliRDQwMjg1NGIwZDNDYTUiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY3NTI1ODA4NDU4NSwibmFtZSI6IkNhbm5lZGJpIE5ldyBCYWRnZXMifQ.yK2gX4DxRn8ASQVvPVN2X6QmA-YjG1LP2kSWkKnNg6M'

// new badges 2
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDA2MzdGNEYyNjhmQzk1NzA2MDM4OTMwYTliRDQwMjg1NGIwZDNDYTUiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY3NTI1OTA2NDYwOSwibmFtZSI6IkNhbm5lZGJpIE5ldyBCYWRnZXMyIn0.jE_svVGAJ6w491yBDJNo6uO_fESsRkI-ibl4-e7IFcw'

async function main() {
  // you'll probably want more sophisticated argument parsing in a real app
  if (process.argv.length !== 3) {
    console.error(`usage: ${process.argv[0]} ${process.argv[1]} <directory-path>`)
  }
  const directoryPath = process.argv[2]
  const files = filesFromPath(directoryPath, {
    pathPrefix: path.resolve(directoryPath), // see the note about pathPrefix below
    hidden: true, // use the default of false if you want to ignore files that start with '.'
  })

  const storage = new NFTStorage({ token })

  console.log(`storing file(s) from ${path}`)
  const cid = await storage.storeDirectory(files)
  console.log({ cid })

  const status = await storage.status(cid)
  console.log(status)
}
main()