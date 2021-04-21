cmake_minimum_required(VERSION 3.0)

project(lab4 LANGUAGES CXX)

add_subdirectory(${CMAKE_SOURCE_DIR}/external/glm)
add_definitions(-Wall -Wextra)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(GLEW_USE_STATIC_LIBS ON)

set(UI_DIR ${CMAKE_SOURCE_DIR}/ui)
set(PRIMITIVES_DIR ${CMAKE_SOURCE_DIR}/primitives)
set(EXTERNAL ${CMAKE_SOURCE_DIR}/external)
set(IMGUI_DIR ${EXTERNAL}/imgui)
set(GLFW_DIR ${EXTERNAL}/glfw)
set(GLEW_DIR ${EXTERNAL}/glew)
set(GLM_DIR ${EXTERNAL}/glm/glm)

set(GLFW_BUILD_DOCS OFF CACHE BOOL "" FORCE)
set(GLFW_BUILD_TESTS OFF CACHE BOOL "" FORCE)
set(GLFW_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)

find_package(OpenGL REQUIRED)
find_library(GLEW_DYLIB GLEW ${CMAKE_SOURCE_DIR}/external/glew/lib)
add_library(glew SHARED IMPORTED)
set_property(TARGET glew PROPERTY IMPORTED_LOCATION ${CMAKE_SOURCE_DIR}/external/glew/lib/libGLEW.a)
set_property(TARGET glew PROPERTY IMPORTED_IMPLIB ${GLEW_DYLIB})

include_directories(${UI_DIR} ${PRIMITIVES_DIR} ${IMGUI_DIR} ${GLFW_DIR}/include ${GLEW_INCLUDE_DIRS} ${GLM_DIR})

add_subdirectory(${CMAKE_SOURCE_DIR}/external/glfw)


add_library(imgui STATIC ${IMGUI_DIR}/imgui.cpp
                         ${IMGUI_DIR}/imgui_draw.cpp
                         ${IMGUI_DIR}/imgui_tables.cpp
                         ${IMGUI_DIR}/imgui_widgets.cpp
                         ${IMGUI_DIR}/imgui_impl_glfw.cpp
                         ${IMGUI_DIR}/imgui_impl_opengl2.cpp)

target_include_directories(imgui PUBLIC
    ${CMAKE_SOURCE_DIR}/external/imgui/
    ${CMAKE_SOURCE_DIR}/external/glew/include/
    ${CMAKE_SOURCE_DIR}/external/glfw/include/
    )

find_package(GLEW REQUIRED)
include_directories(${GLEW_INCLUDE_DIRS})




add_executable(${PROJECT_NAME} 
               ./main.cpp
               ${PRIMITIVES_DIR}/circle.cpp
               ${PRIMITIVES_DIR}/circle.h
               ${PRIMITIVES_DIR}/ellipse.cpp
               ${PRIMITIVES_DIR}/ellipse.h
               ${UI_DIR}/window.cpp
               ${UI_DIR}/window.h
               )


target_link_libraries(${PROJECT_NAME} glew imgui glfw ${OPENGL_LIBRARIES} glm)
