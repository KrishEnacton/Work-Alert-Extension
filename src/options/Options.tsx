import { useEffect, useState } from 'react'
import HeaderSection from './components/sections/HeaderSection'
import MainSection from './components/sections/MainSection'
import ProfileSection from './components/sections/ProfileSection'
import RouteSection from './components/sections/RouteSection'
import { useRecoilState } from 'recoil'
import { isJobs } from './atoms'
import useFirebase from '../customHooks/use-firebase'
import { ImportExportSection } from './components/sections/ImportExport'

function App() {
  const [route, setRoute] = useState('')
  const [isClick, setIsClicked] = useRecoilState(isJobs)
  const { addUser } = useFirebase()

  useEffect(() => {
    setRoute('home')
    chrome.runtime.onMessage.addListener((req) => {
      if (req.type === 'notification_clicked') {
        setRoute('home')
      }
    })
  }, [])

  useEffect(() => {}, [route])

  const loginWithGoogle = () => {
    addUser().then(console.log).catch(console.log)
  }

  return (
    <div className="bg-black text-white min-h-screen">
      {/* <button onClick={loginWithGoogle}>Login with google</button> */}
      {!isClick && (
        <>
          <HeaderSection />
          <RouteSection setRoute={setRoute} />
        </>
      )}
      {route == 'importExport' && (
        <div>
          <ImportExportSection />
        </div>
      )}

      {route == 'home' && (
        <div className="py-4 flex flex-col gap-y-4">
          <MainSection />
        </div>
      )}
      {route == 'profile' && (
        <div className="py-4 flex flex-col gap-y-4">
          <ProfileSection />
        </div>
      )}
    </div>
  )
}

export default App
