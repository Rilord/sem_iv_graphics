cmake_minimum_required(VERSION 3.0)

project(lab4 LANGUAGES CXX)

add_subdirectory(${CMAKE_SOURCE_DIR}/external/glm)
add_definitions(-Wall -Wextra)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

set(UI_DIR ${CMAKE_SOURCE_DIR}/ui)
set(PRIMITIVES_DIR ${CMAKE_SOURCE_DIR}/primitives)
set(EXTERNAL ${CMAKE_SOURCE_DIR}/external)
set(IMGUI_DIR ${EXTERNAL}/imgui)
set(GLFW_DIR ${EXTERNAL}/glfw)
set(GLEW_DIR ${EXTERNAL}/glew)

set(GLFW_BUILD_DOCS OFF CACHE BOOL "" FORCE)
set(GLFW_BUILD_TESTS OFF CACHE BOOL "" FORCE)
set(GLFW_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)

find_package(OpenGL REQUIRED)
find_package(GLEW REQUIRED)

include_directories(${UI_DIR} ${PRIMITIVES_DIR} ${IMGUI_DIR} ${GLFW_DIR} ${GLEW_INCLUDE_DIRS})

add_library(imgui STATIC ${IMGUI_DIR}/imgui.cpp
                         ${IMGUI_DIR}/imgui_draw.cpp
                         ${IMGUI_DIR}/imgui_tables.cpp
                         ${IMGUI_DIR}/imgui_widgets.cpp
                         ${IMGUI_DIR}/imgui_impl_glfw.cpp
                         ${IMGUI_DIR}/imgui_impl_opengl2.cpp)

find_package(GLEW REQUIRED)
include_directories(${GLEW_INCLUDE_DIRS})


add_subdirectory(${CMAKE_SOURCE_DIR}/external/glfw)


add_executable(${PROJECT_NAME} 
               ./main.cpp
               ${PRIMITIVES_DIR}/circle.cpp
               ${PRIMITIVES_DIR}/circle.h
               ${PRIMITIVES_DIR}/ellipse.cpp
               ${PRIMITIVES_DIR}/ellipse.h
               ${UI_DIR}/window.cpp
               ${UI_DIR}/window.h
               )


target_link_libraries(${PROJECT_NAME} ${GLEW_LIBRARIES} imgui glfw ${OPENGL_LIBRARIES})
