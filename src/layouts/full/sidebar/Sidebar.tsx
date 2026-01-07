import { Sidebar } from "flowbite-react";
import SidebarContent from "./Sidebaritems";
import NavItems from "./NavItems";
import React from "react";
import NavCollapse from "./NavCollapse";

const SidebarLayout = () => {
  return (
    <>
      <div className="xl:block hidden">
        {/* Main Sidebar Container - Fixed & Flex */}
        <aside
          className="
            fixed left-0 top-[90px]
            h-[calc(100vh-90px)]
            w-72
            flex flex-col
            bg-white dark:bg-darkgray
            border-r border-gray-200 dark:border-gray-700
            shadow-xl
            z-30
          "
        >
          {/* Header Section (Fixed at top) */}
          <div className="px-6 py-5 flex items-center gap-3 bg-white/50 dark:bg-darkgray/50 shrink-0 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8z" /></svg>
            </div>
            <h2 className="font-bold text-lg tracking-tight text-gray-800 dark:text-white">
              MeintroLab.SAS
            </h2>
          </div>

          {/* Scrollable Menu Section */}
          <div className="
            flex-1 
            overflow-y-auto 
            overflow-x-hidden
            custom-scrollbar
            px-3
            py-4
          ">
            <Sidebar
              aria-label="Sidebar Menu"
              className="!h-auto !w-full !bg-transparent !border-none"
              // Force internal flowbite div to be transparent/auto
              theme={{
                root: {
                  base: "h-auto",
                  inner: "bg-transparent h-auto overflow-visible"
                }
              }}
            >
              <Sidebar.Items>
                <Sidebar.ItemGroup className="space-y-1">
                  {SidebarContent?.map((item) => (
                    <div key={item.heading} className="mb-6">
                      <h5 className="
                        px-4 mb-2 
                        text-xs font-bold uppercase tracking-wider 
                        text-gray-400 dark:text-gray-500
                      ">
                        {item.heading}
                      </h5>

                      {item.children?.map((child, index) => (
                        <React.Fragment key={(child.id ?? index) as React.Key}>
                          {child.children ? (
                            <NavCollapse item={child} />
                          ) : (
                            <NavItems item={child} />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  ))}
                </Sidebar.ItemGroup>
              </Sidebar.Items>
            </Sidebar>
          </div>
        </aside>

        {/* CSS for custom scrollbar (injected here or in global css, but inline works for now) */}
        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 5px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(156, 163, 175, 0.5);
            border-radius: 20px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: rgba(156, 163, 175, 0.8);
          }
        `}</style>
      </div>
    </>
  );
};

export default SidebarLayout;
