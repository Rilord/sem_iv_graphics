#include <GL/glew.h>
#include "GLFW/glfw3.h"
#include <cstring>
#include "glm/fwd.hpp"
#include <iostream>
#include <math.h>
#include <tuple>
#include "imgui.h"
#include "imgui_impl_glfw.h"
#include "imgui_impl_opengl2.h"
#include "implot.h"
#include "circle.h"
#include "ellipse.h"
#include <chrono>
#include <thread>
    

const int steps = 100;
const float angle = 3.1415926 * 2.f / steps;
float aspect = (float) SCREEN_WIDTH / SCREEN_HEIGHT;
const char *glsl_version = "#version 330";

static void key_callback(GLFWwindow* window, int key, int scancode, int action, int mods)
{
    if (key == GLFW_KEY_ESCAPE && action == GLFW_PRESS)
        glfwSetWindowShouldClose(window, GLFW_TRUE);
}


using std::chrono::high_resolution_clock;
using std::chrono::duration_cast;
using std::chrono::duration;
using std::chrono::milliseconds;
using std::chrono::nanoseconds;

int main(void) {

    if (!glfwInit()) {
        std::cout << "[STATUS] failed\n";
        return -1;
    }


    GLFWwindow *window;

    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 2);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 0);

    window = glfwCreateWindow(SCREEN_WIDTH, SCREEN_HEIGHT, "window", NULL, NULL);

    if (!window) {
        std::cout << "[STATUS] failed\n";
        glfwTerminate();
        return -1;
    }


    glfwSetKeyCallback(window, key_callback);
    
    glfwMakeContextCurrent(window);
    glewExperimental=true;

    if (glewInit() != GLEW_OK) {
        std::cout << "[STATUS] failed to run glew\n";
        return -1;
    }
    glfwSwapInterval(1);

    glfwSetInputMode(window, GLFW_STICKY_KEYS, GL_TRUE);

    IMGUI_CHECKVERSION();
    ImGui::CreateContext();
    ImGuiIO &io = ImGui::GetIO();
    (void)io;

    ImGui_ImplGlfw_InitForOpenGL(window, true);
    ImGui_ImplOpenGL2_Init();

    io.Fonts->AddFontDefault();
    ImVec4 clear_color = ImVec4(1.0f, 1.0f, 1.0f, 1.00f);
    ImVec4 draw_color = ImVec4(0.0f, 0.0, 0.0, 1.00f);

    ImPlot::CreateContext();

    glOrtho(-aspect, aspect, -1, 1, -1, 1);
    glLoadIdentity();


    std::vector<circle> circle_array;
    std::vector<circle_spectrum> circle_spectrum_array;
    std::vector<ellipse> ellipse_array;
    std::vector<ellipse_spectrum> ellipse_spectrum_array;
    
    const char *colors[] = { "White", "Black" };
    const char *algorithms[] = { "Canonical",  "Bresenhem", "Midpoint", "Parametrical" };

    static const char *bg_color = NULL;
    static const char *circle_color = NULL;
    static const char *algortithm = NULL;

    // circle data

    float circle_radius = 0.0f;
    float circle_center[2] = { 0.0 };

    // ellipse data

    float ellipse_a = 0.0f;
    float ellipse_b = 0.0f;
    float ellipse_center[2] = { 0.0f };

    // spectrum data
    float spectrum_step = 0.0f;

    float spectrum_step_a = 0.0f;
    float spectrum_step_b = 0.0f;

    int spectrum_n = 0;


    vector<vertex> test_v;

    vector<double> bresenhem_data;
    vector<double> parametrical_data;
    vector<double> canonical_data;
    vector<double> midpoint_data;
    vector<double> x_data;

    for (auto i = 10; i < 1000; i *= 10) {
        x_data.push_back(i);
        double sum = 0;
        for (auto j = 0 ; j < 1000; j++) {
            auto t1 = high_resolution_clock::now();
            circle_bresenhem(test_v, glm::vec2(0, 0), i);
            auto t2 = high_resolution_clock::now();
            sum += (duration_cast<nanoseconds>(t2 - t1).count());
        }
        bresenhem_data.push_back(sum / 1000);
        
    }

    for (auto i = 10; i < 1000; i *= 10) {
        double sum = 0;
        for (auto j = 0 ; j < 1000; j++) {
            auto t1 = high_resolution_clock::now();
            circle_parametrical(test_v, glm::vec2(0, 0), i);
            auto t2 = high_resolution_clock::now();
            sum += (duration_cast<nanoseconds>(t2 - t1).count());
        }
        parametrical_data.push_back(sum / 1000);
        
    }


    for (auto i = 10; i < 1000; i *= 10) {
        double sum = 0;
        for (auto j = 0 ; j < 1000; j++) {
            auto t1 = high_resolution_clock::now();
            circle_canonical(test_v, glm::vec2(0, 0), i);
            auto t2 = high_resolution_clock::now();
            sum += (duration_cast<nanoseconds>(t2 - t1).count());
        }
        canonical_data.push_back(sum / 1000);
    }

    for (auto i = 10; i < 1000; i *= 10) {
        double sum = 0;
        for (auto j = 0 ; j < 1000; j++) {
            auto t1 = high_resolution_clock::now();
            circle_midpoint(test_v, glm::vec2(0, 0), i);
            auto t2 = high_resolution_clock::now();
            sum += (duration_cast<nanoseconds>(t2 - t1).count());
        }
        midpoint_data.push_back(sum / 1000);
    }

    while(!glfwWindowShouldClose(window)) {
        glfwPollEvents();
        ImGui_ImplOpenGL2_NewFrame();
        ImGui_ImplGlfw_NewFrame();


        ImGui::NewFrame();

        ImGui::Begin("Lab");

        if (ImGui::BeginCombo("Algorithm", algortithm)) {
            for (auto n = 0; n < IM_ARRAYSIZE(algorithms); n++) {
                bool is_selected = (algortithm == algorithms[n]);

                if (ImGui::Selectable(algorithms[n], algortithm)) {
                    algortithm = algorithms[n];
                }

                if (is_selected)
                    ImGui::SetItemDefaultFocus();
            }
            ImGui::EndCombo();
            
        }

        if (ImGui::BeginCombo("Drawing color", circle_color)) {
            for (auto n = 0; n < IM_ARRAYSIZE(colors); n++) {
                bool is_selected = (circle_color == colors[n]);

                if (ImGui::Selectable(colors[n], circle_color)) {
                    if (strcmp(colors[n], "White") == 0)
                        draw_color = { 1.0, 1.0, 1.0, 1.0 };
                    else 
                        draw_color = { 0.0, 0.0, 0.0, 1.0 };
                    circle_color = colors[n];
                }

                if (is_selected)
                    ImGui::SetItemDefaultFocus();
            }
            ImGui::EndCombo();
            
        }



        if (ImGui::BeginCombo("Background color", bg_color)) {
            for (auto n = 0; n < IM_ARRAYSIZE(colors); n++) {
                bool is_selected = (bg_color == colors[n]);

                if (ImGui::Selectable(colors[n], bg_color)) {
                    if (strcmp(colors[n], "White") == 0)
                        clear_color = { 1.0, 1.0, 1.0, 1.0 };
                    else 
                        clear_color = { 0.0, 0.0, 0.0, 1.0 };

                    bg_color = colors[n];
                }

                if (is_selected)
                    ImGui::SetItemDefaultFocus();
            }
            ImGui::EndCombo();
            
        }


        ImGui::Text("Center & radius");

        ImGui::InputFloat2("center x | center y", circle_center);

        ImGui::InputFloat("radius", &circle_radius);

        if (ImGui::Button("Draw circle")) {
            glm::vec4 col(draw_color.x, draw_color.y, draw_color.z, draw_color.w);
            glm::vec2 c(circle_center[0], circle_center[1]);
            if (strcmp(algortithm, "Bresenhem") == 0) {
                circle_array.push_back(
                        circle(circle_radius, 
                            col, c, 
                            circle_bresenhem));
            } else if(strcmp(algortithm, "Canonical") == 0) {
                circle_array.push_back(
                        circle(circle_radius, 
                            col, c, 
                            circle_canonical));
            } else if(strcmp(algortithm, "Midpoint") == 0) {
                circle_array.push_back(
                        circle(circle_radius, 
                            col, c, 
                            circle_midpoint));
            } else if(strcmp(algortithm, "Parametrical") == 0) {
                circle_array.push_back(
                        circle(circle_radius, 
                            col, c, 
                            circle_parametrical));
            }
        }

        ImGui::Text("Spectrum");

        ImGui::InputFloat("Specter step", &spectrum_step);
        ImGui::InputInt("Specter number", &spectrum_n);

        if (ImGui::Button("Draw circle spectrum")) {
            glm::vec4 col(draw_color.x, draw_color.y, draw_color.z, draw_color.w);
            glm::vec2 c(circle_center[0], circle_center[1]);
            if (strcmp(algortithm, "Bresenhem") == 0) {
                circle_spectrum_array.push_back(circle_spectrum(circle_radius, 
                            spectrum_step, spectrum_n, 
                            col, c, circle_bresenhem));
            } else if(strcmp(algortithm, "Canonical") == 0) {
                circle_spectrum_array.push_back(circle_spectrum(circle_radius, 
                            spectrum_step, spectrum_n, 
                            col, c, circle_canonical));
            } else if(strcmp(algortithm, "Midpoint") == 0) {
                circle_spectrum_array.push_back(circle_spectrum(circle_radius, 
                            spectrum_step, spectrum_n, 
                            col, c, circle_midpoint));
            } else if(strcmp(algortithm, "Parametrical") == 0) {
                circle_spectrum_array.push_back(circle_spectrum(circle_radius, 
                            spectrum_step, spectrum_n, 
                            col, c, circle_parametrical));
            }
        }

        ImGui::Text("Ellipse");
        ImGui::InputFloat2("Ellipse center(x, y)", ellipse_center);
        ImGui::InputFloat("Ellipse a", &ellipse_a);
        ImGui::InputFloat("Ellipse b", &ellipse_b);

        if (ImGui::Button("Draw ellipse")) {
            glm::vec4 col(draw_color.x, draw_color.y, draw_color.z, draw_color.w);
            glm::vec2 c(ellipse_center[0], ellipse_center[1]);
            if (strcmp(algortithm, "Bresenhem") == 0) {
                ellipse_array.push_back(ellipse(ellipse_a, ellipse_b, c,
                            col, ellipse_bresenhem));
            } else if(strcmp(algortithm, "Canonical") == 0) {
                ellipse_array.push_back(ellipse(ellipse_a, ellipse_b, c,
                            col, ellipse_canonical));
            } else if(strcmp(algortithm, "Midpoint") == 0) {
                ellipse_array.push_back(ellipse(ellipse_a, ellipse_b, c,
                            col, ellipse_midpoint));
            } else if(strcmp(algortithm, "Parametrical") == 0) {
                ellipse_array.push_back(ellipse(ellipse_a, ellipse_b, c,
                            col, ellipse_parametrical));
            }
        }

        ImGui::InputFloat("Ellipse step a", &spectrum_step_a);
        ImGui::InputFloat("Ellipse step b", &spectrum_step_b);

        if (ImGui::Button("Draw ellipse spectrum")) {
            glm::vec4 col(draw_color.x, draw_color.y, draw_color.z, draw_color.w);
            glm::vec2 c(ellipse_center[0], ellipse_center[1]);
            if (strcmp(algortithm, "Bresenhem") == 0) {
                ellipse_spectrum_array.push_back(ellipse_spectrum(ellipse_a, ellipse_b, c,
                            col, spectrum_n, spectrum_step_a, spectrum_step_b, ellipse_bresenhem));
            } else if(strcmp(algortithm, "Canonical") == 0) {
                ellipse_spectrum_array.push_back(ellipse_spectrum(ellipse_a, ellipse_b, c,
                            col, spectrum_n, spectrum_step_a, spectrum_step_b, ellipse_canonical));
            } else if(strcmp(algortithm, "Midpoint") == 0) {
                ellipse_spectrum_array.push_back(ellipse_spectrum(ellipse_a, ellipse_b, c,
                            col, spectrum_n, spectrum_step_a, spectrum_step_b, ellipse_midpoint));
            } else if(strcmp(algortithm, "Parametrical") == 0) {
                ellipse_spectrum_array.push_back(ellipse_spectrum(ellipse_a, ellipse_b, c,
                            col, spectrum_n, spectrum_step_a, spectrum_step_b, ellipse_parametrical));
            }
        }

        if (ImGui::CollapsingHeader("Stats")) {
            if (ImPlot::BeginPlot("Time measurments")) {
                ImPlot::PlotScatter("Bresenhem", bresenhem_data.data(), x_data.data(), bresenhem_data.size());
                ImPlot::PlotScatter("Parametrical", parametrical_data.data(), x_data.data(), parametrical_data.size());
                ImPlot::PlotScatter("Midpoint", midpoint_data.data(), x_data.data(), midpoint_data.size());
                ImPlot::PlotScatter("Canonical", canonical_data.data(), x_data.data(), canonical_data.size());
                ImPlot::EndPlot();
            }
        }

        if (ImGui::Button("Clear")) {
            circle_array.clear();
            circle_spectrum_array.clear();
            ellipse_array.clear();
            ellipse_spectrum_array.clear();
        }


        ImGui::End();
        ImGui::Render();




        glClearColor(clear_color.x, clear_color.y, clear_color.z, clear_color.w);
        glClear(GL_COLOR_BUFFER_BIT);

        // DRAW ZONE

        for (auto &c: circle_array) {
            c.render();
        }

        for (auto &spectrum: circle_spectrum_array) {
            spectrum.render();
        }


        for (auto &e: ellipse_array) {
            e.render();
        }

        for (auto &e: ellipse_spectrum_array) {
            e.render();
        }

        //


        ImGui_ImplOpenGL2_RenderDrawData(ImGui::GetDrawData());

        glfwMakeContextCurrent(window);
        glfwSwapBuffers(window);

    }

    ImGui_ImplOpenGL2_Shutdown();
    ImGui_ImplGlfw_Shutdown();
    ImPlot::DestroyContext();
    ImGui::DestroyContext();

    glfwDestroyWindow(window);
    glfwTerminate();

    return 0;
}
