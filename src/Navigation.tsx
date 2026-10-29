import { Navigate, RouterProvider, createBrowserRouter, createHashRouter } from 'react-router-dom'
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
const router = (import.meta.env.DEV ? createBrowserRouter : createHashRouter)([
    {
        path: "/",
        errorElement: (<ScreenError />),
        element: <Navigate to="/tools" replace />
    },
    {
        path: "/create-tool",
        errorElement: (<ScreenError />),
        element: import.meta.env.DEV ? <ScreenCreateTool /> : <Navigate to="/tools" replace />
    },
    {
        path: "/manage-tools",
        errorElement: <ScreenError />,
        element: import.meta.env.DEV ? <ScreenManageTools /> : <Navigate to="/tools" replace />
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
])
export default Navigation
