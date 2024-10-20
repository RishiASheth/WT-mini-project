`timescale 1ns / 1ps

module tb_up_down_counter;

// Inputs
reg clk;
reg up_down;

// Outputs
wire [2:0] Q;

// Instantiate the Unit Under Test (UUT)
up_down_counter uut (
    .Q(Q),
    .clk(clk),
    .up_down(up_down)
);

// Clock Generation: Toggle every 10 ns
initial begin
    clk = 0;
    forever #5 clk = ~clk;  // Toggle clock every 5 ns (10 ns period)
end

// Test stimulus
initial begin
    // Initialize Inputs
    up_down = 1; // Start by counting up

    // Print the state every clock cycle
    forever begin
        @(posedge clk);  // Wait for the rising edge of clk
        $display("At time %t: clk = %b, up_down = %b, Q = %b", $time, clk, up_down, Q);
    end
end

// Additional stimulus
initial begin
    // Run for some time with 'up_down = 1' (UP)
    #80;  // Run for 80 ns (8 clock cycles)
    
    // Change to 'up_down = 0' (DOWN)
    up_down = 0;

    // Run for another 80 ns (8 clock cycles)
    #80;

    // Finish the simulation
    $finish;
end

// Generate VCD file for GTKWave
initial begin
    $dumpfile("up_down_counter.vcd"); // VCD output file
    $dumpvars(0, tb_up_down_counter);  // Dump all variables
end

endmodule
