// SR Flip-Flop Module
module sr_ff(Q, Qn, S, R, clk);
    input S, R, clk;
    output reg Q, Qn;

    initial begin
        Q = 0;
        Qn = 1;
    end

    always @(posedge clk) begin
        if (S == 1 && R == 0) begin
            Q <= 1;
            Qn <= 0;
        end
        else if (S == 0 && R == 1) begin
            Q <= 0;
            Qn <= 1;
        end
        else if (S == 0 && R == 0) begin
            // Maintain the current state
            Q <= Q;
            Qn <= Qn;
        end
        else if (S == 1 && R == 1) begin
            // Undefined state should not happen
            Q <= 1'bx;
            Qn <= 1'bx;
        end
    end
endmodule

// T Flip-Flop Module
module t_ff(Q, Qn, T, clk);
    input T, clk;
    output reg Q, Qn;

    initial begin
        Q = 0;
        Qn = 1;
    end

    always @(posedge clk) begin
        if (T) begin
            Q <= ~Q;       // Toggle state if T is high
            Qn <= ~Qn;     // Toggle complementary output
        end
    end
endmodule

// 3-bit Up-Down Counter
module up_down_counter(Q, clk, up_down);
    input clk, up_down;
    output reg [2:0] Q;

    initial begin
        Q = 3'b000;  // Initialize counter to zero
    end

    always @(posedge clk) begin
        if (up_down) begin
            Q <= Q + 1;  // Count up
        end else begin
            Q <= Q - 1;  // Count down
        end
    end
endmodule
