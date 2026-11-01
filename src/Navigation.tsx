import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'
import ScreenCreateTool from './screens/CreateTool'
import ScreenManageTools from './screens/ManageTools'
import ScreenViewTool from './screens/ViewTool'
import ScreenTools from './screens/Tools'

const Navigation = () => {
    return (
        <RouterProvider
            router={router}
        />
    )
}
const ScreenError = () => (<p>Error</p>)
const router = createBrowserRouter([
    {
        path: "/",
        errorElement: (<ScreenError />),
        element: <Navigate to="/tools" replace />
    },
    {
        path: "/create-tool",
        errorElement: (<ScreenError />),
        element: <ScreenCreateTool />
    },
    {
        path: "/manage-tools",
        errorElement: <ScreenError />,
        element: <ScreenManageTools />
    },
    {
        path: "/tools",
        errorElement: <ScreenError />,
        element: <ScreenTools />
    },
    {
        path: "/tools/:toolId",
        errorElement: <ScreenError />,
        element: <ScreenViewTool />
    }
], { basename: import.meta.env.BASE_URL })
export default Navigation
