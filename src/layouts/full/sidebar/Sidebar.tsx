import { Sidebar } from "flowbite-react";
import SidebarContent from "./Sidebaritems";
import NavItems from "./NavItems";
import React from "react";
import NavCollapse from "./NavCollapse";

const SidebarLayout = () => {
  return (
    <>
      <div className="xl:block hidden">
        <Sidebar
          aria-label="Sidebar with multi-level dropdown example"
          className="
            fixed left-0 top-[90px]
            h-[calc(100dvh-90px)]
            w-72
            bg-white dark:bg-darkgray
            menu-sidebar
            flex flex-col
            min-h-0
          "
        >
          {/* Header (no scrollea) */}
          <div className="px-6 py-4 flex items-center bg-white dark:bg-darkgray shrink-0">
            <h2>MeintroLab.SAS</h2>
          </div>

          {/* Body (sí scrollea) */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            <Sidebar.Items className="px-5 mt-2">
              <Sidebar.ItemGroup className="sidebar-nav hide-menu">
                {SidebarContent?.map((item) => (
                  <div className="caption" key={item.heading}>
                    <h5 className="text-link dark:text-white/70 caption font-semibold leading-6 tracking-widest text-xs pb-2 uppercase">
                      {item.heading}
                    </h5>

                    {item.children?.map((child, index) => (
                      <React.Fragment key={(child.id ?? index) as React.Key}>
                        {child.children ? (
                          <div className="collpase-items">
                            <NavCollapse item={child} />
                          </div>
                        ) : (
                          <NavItems item={child} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                ))}
              </Sidebar.ItemGroup>
            </Sidebar.Items>
          </div>
        </Sidebar>
      </div>
    </>
  );
};

export default SidebarLayout;
